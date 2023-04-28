from datetime import datetime, timedelta

import boto3
from flask import Blueprint, request, jsonify

from .costexplorer_client import CostExplorerClient, CostExplorerNotActiveException
from ..PclusterApiHandler import authenticated
from ..pcm_globals import logger
from ..security.csrf.csrf import csrf_needed
from ..utils import to_utc_datetime
from ..validation import validated
from ..validation.schemas import GetCostData

CACHED_RESPONSE_MAX_AGE = 60 * 60 * 12

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


@costs.get('/clusters/<cluster_name>')
@authenticated({'admin'})
@validated(params=GetCostData)
def get_cost_data_for(cluster_name):
    start = to_utc_datetime(request.args.get('start')).date().isoformat()
    end = to_utc_datetime(request.args.get('end', default=datetime.today().isoformat())).date().isoformat()

    cost_amounts = client.get_cost_data(cluster_name=cluster_name, start=start, end=end)

    return __cached_response(jsonify({'costs': cost_amounts}), max_age=CACHED_RESPONSE_MAX_AGE)


def __cached_response(response, max_age):
    response.cache_control.max_age = max_age
    response.cache_control.private = True
    response.cache_control.immutable = True
    response.last_modified = datetime.now()
    response.expires = datetime.now() + timedelta(seconds=max_age)

    return response


@costs.errorhandler(CostExplorerNotActiveException)
def handle_costexplorer_not_init_error(err):
    code, description = 405, str(err)
    logger.error(description, extra=dict(status=code, exception=type(err)))
    return {'code': code, 'message': str(err)}, code
