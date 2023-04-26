import boto3
from flask import Blueprint

from .costexplorer_client import CostExplorerClient, CostExplorerNotActiveException
from ..PclusterApiHandler import authenticated
from ..pcm_globals import logger
from ..security.csrf.csrf import csrf_needed

COST_ALLOCATION_TAGS = ['parallelcluster:cluster-name']

costs = Blueprint('costs', __name__)

costexplorer = boto3.client('ce')
client = CostExplorerClient(costexplorer, cost_allocation_tags=COST_ALLOCATION_TAGS)


@costs.get('')
@authenticated({'admin'})
def cost_monitoring_status():
    active = client.is_active()
    return {'active': active}, 200


@costs.put('')
@authenticated({'admin'})
@csrf_needed
def activate_cost_monitoring():
    client.activate()
    return {}, 204


@costs.errorhandler(CostExplorerNotActiveException)
def handle_costexplorer_not_init_error(err):
    code, description = 405, str(err)
    logger.error(description, extra=dict(status=code, exception=type(err)))
    return {'code': code, 'message': str(err)}, code
