import pytest

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
    Give a cost explorer client with valid tags
        and not all target tags activated
            it should return False
    """
    tags = ['parallelcluster:cluster-name', 'parallelcluster:other-tag']
    client = CostExplorerClient(costexplorer, cost_allocation_tags=tags)

    client.get_cost_monitoring_tags = mocker.MagicMock(return_value=[{'Status': 'Active'}, {'Status': 'Inactive'}])

    is_active = client.is_active()

    assert not is_active
    client.get_cost_monitoring_tags.assert_called_once()

def test_costexplorer_is_active_true(costexplorer, mocker):
    """
    Give a cost explorer client with valid tags
        and all target tags activated
            it should return True
    """
    tags = ['parallelcluster:cluster-name', 'parallelcluster:other-tag']
    client = CostExplorerClient(costexplorer, cost_allocation_tags=tags)

    client.get_cost_monitoring_tags = mocker.MagicMock(return_value=[{'Status': 'Active'}, {'Status': 'Active'}])

    is_active = client.is_active()

    assert is_active
    client.get_cost_monitoring_tags.assert_called_once()