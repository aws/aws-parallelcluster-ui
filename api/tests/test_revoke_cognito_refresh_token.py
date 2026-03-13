from unittest.mock import call, ANY

import pytest

from api.PclusterApiHandler import revoke_cognito_refresh_token
from api.logging.logger import DefaultLogger


@pytest.fixture
def mock_requests(mocker):
    return mocker.patch('api.PclusterApiHandler.requests')

@pytest.fixture
def mock_logger(mocker):
    return mocker.patch('api.PclusterApiHandler.logger', DefaultLogger(is_running_local=False))

class MockResponse:
    def __init__(self, status_code):
        self.status_code = status_code

def test_revoke_cognito_refresh_token_success(mock_requests):
    mock_requests.post.return_value = MockResponse(200)

    revoke_cognito_refresh_token('refresh-token')

    mock_requests.post.assert_called_once_with(
        ANY,
        data={'token': 'refresh-token'},
        auth=ANY,
        headers={'Content-Type': 'application/x-www-form-urlencoded'},
    )


def test_revoke_cognito_refresh_token_failing(mock_requests, mock_logger, caplog):
    mock_requests.post.return_value = MockResponse(400)

    revoke_cognito_refresh_token('refresh-token')

    mock_requests.post.assert_called_once_with(
        ANY,
        data={'token': 'refresh-token'},
        auth=ANY,
        headers={'Content-Type': 'application/x-www-form-urlencoded'},
    )
    assert "Unable to revoke cognito refresh token" in caplog.text
