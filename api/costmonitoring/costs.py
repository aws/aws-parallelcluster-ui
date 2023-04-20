import boto3
from botocore.exceptions import ClientError
from flask import Blueprint

from .costexplorer_client import CostExplorerClient, CostMonitoringActivationException
from ..PclusterApiHandler import authenticated

COST_ALLOCATION_TAGS = ['parallelcluster:cluster-name']

costs = Blueprint('costs', __name__)

costexplorer = boto3.client('ce')
client = CostExplorerClient(costexplorer, cost_allocation_tags=COST_ALLOCATION_TAGS)


@costs.get('/')
@authenticated({'admin'})
def cost_monitoring_status():
    active = client.is_active()
    return {'active': active}, 200


@costs.put('/')
@authenticated({'admin'})
def activate_cost_monitoring():
    client.activate()
    return {}, 204


@costs.errorhandler(ClientError)
def handle_costexplorer_not_init_error(err):
    code, message = 400, err.response['Error']['Message']
    if message == 'User not enabled for cost explorer access':
        code = 405

    return {'code': code, 'message': message}, code


@costs.errorhandler(CostMonitoringActivationException)
def handle_costmonitoring_errors(err):
    return {'code': 400, 'message': str(err)}, 400
