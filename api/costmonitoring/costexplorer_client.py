USER_DEFINED_TAG_TYPE = 'UserDefined'
ACTIVE_TAG_STATUS = 'Active'


class CostExplorerClient:

    def __init__(self, client, cost_allocation_tags):
        self.client = client
        if not cost_allocation_tags:
            raise ValueError('cost_allocation_tags cannot be empty or None')
        self.cost_allocation_tags = cost_allocation_tags

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

    def get_cost_monitoring_tags(self):
        response = self.client.list_cost_allocation_tags(
            TagKeys=self.cost_allocation_tags,
            Type=USER_DEFINED_TAG_TYPE,
        )

        return response['CostAllocationTags']


class CostMonitoringActivationException(Exception):
    def __init__(self, cost_activation_errors):
        super().__init__()
        self.cost_activation_errors = cost_activation_errors

    def __str__(self):
        return f'Unable to activate cost monitoring, errors: {str(self.cost_activation_errors)}'

