from flask import jsonify

from api.costmonitoring.costs import __cached_response


def test_cached_response(dev_app):
    """
    When caching a response object
      it should present the necessary headers (Expires, Cache control and Last-Modified)
      it should set the content as private-cachable and immutable
    """
    with dev_app.app_context():
        response = jsonify({})

    response_with_cachecontrol = __cached_response(response, 60 * 60 * 12)

    headers = dict(response_with_cachecontrol.headers)

    assert 'Cache-Control' in headers
    assert 'Last-Modified' in headers
    assert 'Expires' in headers

    assert 'private' in headers['Cache-Control']
    assert 'immutable' in headers['Cache-Control']
    assert 'max-age=' in headers['Cache-Control']
