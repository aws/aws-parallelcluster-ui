from botocore.exceptions import ClientError

from api.pcm_globals import logger

USER_DEFINED_TAG_TYPE = 'UserDefined'
ACTIVE_TAG_STATUS = 'Active'

COST_DATA_FILTER_DEFAULT_GRANULARITY = 'MONTHLY'
COST_DATA_FILTER_CLUSTER_NAME = 'parallelcluster:cluster-name'
COST_DATA_FILTER_METRIC = 'UnblendedCost'
COST_DATA_FILTER_MATCH_OPTIONS = ['EQUALS']


def is_costexplorer_not_active_exception(error: ClientError):
    message = error.response['Error']['Message']
    return message == 'User not enabled for cost explorer access'


def clienterror_handled(func):
    def handle_costexplorer_clienterror(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except ClientError as err:
            if is_costexplorer_not_active_exception(err):
                raise CostExplorerNotActiveException(err.response['Error']['Message']) from None
            raise err from None

    return handle_costexplorer_clienterror


class CostExplorerClient:

    def __init__(self, client, cost_allocation_tags):
        self.client = client
        if not cost_allocation_tags:
            raise ValueError('cost_allocation_tags cannot be empty or None')
        self.cost_allocation_tags = cost_allocation_tags

    @clienterror_handled
    def activate(self):
        tags_to_activate = list({'TagKey': tag, 'Status': ACTIVE_TAG_STATUS} for tag in self.cost_allocation_tags)

        response = self.client.update_cost_allocation_tags_status(
            CostAllocationTagsStatus=tags_to_activate
        )
        errors = response['Errors']
        if errors:
            raise CostMonitoringActivationException(errors)

    def is_active(self):
        tags = self.get_cost_monitoring_tags()

        active = len(tags) > 0
        for tag_status in (tag['Status'] for tag in tags):
            active = active and (tag_status == ACTIVE_TAG_STATUS)

        return active

    @clienterror_handled
    def get_cost_monitoring_tags(self):
        response = self.client.list_cost_allocation_tags(
            TagKeys=self.cost_allocation_tags,
            Type=USER_DEFINED_TAG_TYPE,
        )

        return response['CostAllocationTags']

    def get_cost_data(self, cluster_name, start, end, granularity=COST_DATA_FILTER_DEFAULT_GRANULARITY,
                      metric=COST_DATA_FILTER_METRIC):
        if not cluster_name:
            raise ValueError('Missing mandatory `cluster_name` parameter')
        if not start or not end:
            raise ValueError('Missing mandatory `start` and/or `stop` parameters')

        costs, next_token = self.__retrieve_cost_data(cluster_name, start, end, granularity, [metric])

        while next_token is not None:
            _costs, next_token = self.__retrieve_cost_data(cluster_name, start, end, granularity, [metric])
            costs.extend(_costs)

        costs = self.map_cost_values(costs, metric)
        return sorted(costs, key=lambda cost: cost['period']['start'])

    @clienterror_handled
    def __retrieve_cost_data(self, cluster_name, start, end, granularity, metrics):
        response = self.client.get_cost_and_usage(
            TimePeriod={
                'Start': start,
                'End': end
            },
            Granularity=granularity,
            Filter={
                'Tags': {
                    'Key': COST_DATA_FILTER_CLUSTER_NAME,
                    'Values': [cluster_name],
                    'MatchOptions': COST_DATA_FILTER_MATCH_OPTIONS
                }
            },
            Metrics=metrics
        )
        if not self.__is_boto_response_successful(response):
            logger.error(f'Unable to retrieve costs data for cluster: "{cluster_name}"',
                         extra={'cluster_name': cluster_name, 'start': start, 'end': end})
            raise Exception(f'Unable to retrieve costs data for cluster: "{cluster_name}"')

        costs = response['ResultsByTime']
        next_token = response.get('NextPageToken')

        return costs, next_token

    @staticmethod
    def map_cost_values(costs, metric=COST_DATA_FILTER_METRIC):
        return list(map(lambda cost: CostExplorerClient.__map_cost(cost, metric), costs))

    @staticmethod
    def __map_cost(cost, metric):
        start, end = cost['TimePeriod']['Start'], cost['TimePeriod']['End']
        total = cost['Total'][metric]
        return {'period': {'start': start, 'end': end}, 'amount': total['Amount'], 'unit': total['Unit']}

    def __is_boto_response_successful(self, response):
        return response['ResponseMetadata']['HTTPStatusCode'] == 200


class CostMonitoringActivationException(Exception):
    def __init__(self, cost_activation_errors):
        super().__init__()
        self.cost_activation_errors = cost_activation_errors

    def __str__(self):
        return f'Unable to activate cost monitoring, errors: {str(self.cost_activation_errors)}'


class CostExplorerNotActiveException(Exception):
    def __init__(self, description):
        self.description = description

    def __str__(self):
        return self.description
