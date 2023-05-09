import pytest

from botocore.exceptions import ClientError
from api.costmonitoring.costexplorer_client import CostExplorerClient, CostMonitoringActivationException


@pytest.fixture
def costexplorer(mocker):
    return mocker.Mock()


def test_costexplorerclient_init_failing(costexplorer):
    """
    Given a cost exporer client
        and a not valid list of cost allocation tags
            it should raise a ValueError
    """

    with pytest.raises(Exception):
        CostExplorerClient(costexplorer, [])
        CostExplorerClient(costexplorer, None)


def test_costexplorer_activate(costexplorer):
    """
    Given a cost explorer client
        and cost monitoring not enabled
            it should be able to activate it
    """
    tags = ['parallelcluster:cluster-name']
    costexplorer.update_cost_allocation_tags_status.return_value = {'Errors': []}

    client = CostExplorerClient(costexplorer, cost_allocation_tags=tags)
    client.activate()

    expected_argument = [{'TagKey': 'parallelcluster:cluster-name', 'Status': 'Active'}]

    costexplorer.update_cost_allocation_tags_status.assert_called_once_with(CostAllocationTagsStatus=expected_argument)


def test_costexplorer_activate_failing(costexplorer):
    """
    Given a cost explorer client
        and cost monitoring not enabled
            in case of impossibility to perform the action for external causes
                it should raise a CostMonitoringActivationException
    """
    tags = ['parallelcluster:cluster-name']
    costexplorer.update_cost_allocation_tags_status.return_value = {'Errors': ['some-error']}

    with pytest.raises(CostMonitoringActivationException):
        client = CostExplorerClient(costexplorer, cost_allocation_tags=tags)
        client.activate()


def test_costexplorer_get_cost_monitoring_tags(costexplorer):
    """
    Given a cost explorer client with valid tags
        and available tags to list in AWS Billing
            it should invoke the costexplorer method
            it should be able to return tags with statuses
    """
    tags = ['parallelcluster:cluster-name']
    costexplorer.list_cost_allocation_tags.return_value = {
        'CostAllocationTags': [
            {
                'TagKey': 'parallelcluster:cluster-name',
                'Type': 'UserDefined',
                'Status': 'Active'
            }
        ]
    }

    client = CostExplorerClient(costexplorer, cost_allocation_tags=tags)
    listed_tags = client.get_cost_monitoring_tags()

    costexplorer.list_cost_allocation_tags.assert_called_once_with(TagKeys=tags, Type='UserDefined')
    assert listed_tags == [
        {'TagKey': 'parallelcluster:cluster-name', 'Type': 'UserDefined', 'Status': 'Active'}
    ]


def test_costexplorer_is_active(costexplorer, mocker):
    """
    Given a cost explorer client with valid tags
        and not all target tags activated
            it should return False
    """
    tags = ['parallelcluster:cluster-name', 'parallelcluster:other-tag']
    client = CostExplorerClient(costexplorer, cost_allocation_tags=tags)

    client.get_cost_monitoring_tags = mocker.MagicMock(return_value=[{'Status': 'Active'}, {'Status': 'Inactive'}])

    is_active = client.is_active()

    assert not is_active
    client.get_cost_monitoring_tags.assert_called_once()

def test_costexplorer_is_active_when_ce_cannot_be_accessed(costexplorer, mocker):
    """
    Given a cost explorer client with valid tags
        and Cost Explorer cannot be accessed
            it should return False
    """
    tags = ['parallelcluster:cluster-name']

    client = CostExplorerClient(costexplorer, cost_allocation_tags=tags)
    costexplorer.list_cost_allocation_tags.side_effect=ClientError(
        {
            "Error": {
                "Code": "AccessDeniedException",
                "Message": "User not enabled for cost explorer access"
            }
        },
        "list_cost_allocation_tags"   
    )

    is_active = client.is_active()

    assert not is_active

def test_costexplorer_is_active_failing(costexplorer):
    """
    Given a cost explorer client with valid tags
      and an error occurs while listing the allocation tags
        it should rethrow the error
    """
    tags = ['parallelcluster:cluster-name']

    client = CostExplorerClient(costexplorer, cost_allocation_tags=tags)
    costexplorer.list_cost_allocation_tags.side_effect=ClientError(
        {
            "Error": {
                "Code": "AccessDeniedException",
                "Message": "any_other_message"
            }
        },
        "list_cost_allocation_tags"   
    )

    with pytest.raises(Exception):
        client = CostExplorerClient(costexplorer, cost_allocation_tags=tags)
        client.is_active()

def test_costexplorer_is_active_true(costexplorer, mocker):
    """
    Given a cost explorer client with valid tags
        and all target tags activated
            it should return True
    """
    tags = ['parallelcluster:cluster-name', 'parallelcluster:other-tag']
    client = CostExplorerClient(costexplorer, cost_allocation_tags=tags)

    client.get_cost_monitoring_tags = mocker.MagicMock(return_value=[{'Status': 'Active'}, {'Status': 'Active'}])

    is_active = client.is_active()

    assert is_active
    client.get_cost_monitoring_tags.assert_called_once()


def test_get_cost_data(costexplorer):
    """
    Given a cost explorer client with valid tags
      when retrieving cost data with valid parameters
        it should return mapped cost data
        it should return data ordered by "start" field
    """
    costexplorer.get_cost_and_usage.return_value = {
        'ResponseMetadata': {'HTTPStatusCode': 200},
        'ResultsByTime': [
            {
                'TimePeriod': {
                    'Start': '2023-05-01',
                    'End': '2023-06-01'
                },
                'Total': {
                    'UnblendedCost': {
                        'Amount': '42',
                        'Unit': 'USD'
                    }
                }
            },
            {
                'TimePeriod': {
                    'Start': '2023-06-01',
                    'End': '2023-07-01'
                },
                'Total': {
                    'UnblendedCost': {
                        'Amount': '35',
                        'Unit': 'USD'
                    }
                }
            }
        ]
    }

    tags = ['parallelcluster:cluster-name']
    client = CostExplorerClient(costexplorer, cost_allocation_tags=tags)

    costs = client.get_cost_data('cluster-name', start='2023-05-01', end='2023-07-01')

    assert costs == [
        {'period': {'start': '2023-05-01', 'end': '2023-06-01'}, 'amount': 42, 'unit': 'USD'},
        {'period': {'start': '2023-06-01', 'end': '2023-07-01'}, 'amount': 35, 'unit': 'USD'}
    ]


def test_get_cost_data_failing(costexplorer):
    """
    Given a cost explorer client with valid tags
      when retrieving cost data with valid parameters
        when an unpredictable exception occurs
        it should re-raise the same Error
    """
    tags = ['parallelcluster:cluster-name']
    client = CostExplorerClient(costexplorer, cost_allocation_tags=tags)
    costexplorer.get_cost_and_usage.side_effect = ArithmeticError

    with pytest.raises(ArithmeticError):
        client.get_cost_data('cluster-name', '2023-05-01', '2023-06-02')



def test_get_cost_data_missing_parameter(costexplorer):
    """
    Given a cost explorer client with valid tags
      when retrieving cost data
        it should validate mandatory parameters presence
    """
    tags = ['parallelcluster:cluster-name']
    client = CostExplorerClient(costexplorer, cost_allocation_tags=tags)

    with pytest.raises(ValueError) as ex_cluster_name:
        client.get_cost_data(None, start='start-date', end='end-date')
    with pytest.raises(ValueError) as ex_start_date:
        client.get_cost_data('cluster-name', start=None, end='end-date')
    with pytest.raises(ValueError) as ex_end_date:
        client.get_cost_data('cluster-name', start='start-date', end=None)

    assert 'cluster_name' in str(ex_cluster_name.value)
    assert 'start' in str(ex_start_date.value)
    assert 'end' in str(ex_end_date.value)
