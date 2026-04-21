import logging
import shlex
import pytest
from unittest import mock

from api.PclusterApiHandler import ssm_command
from api.pcm_globals import _logger_ctxvar


@pytest.fixture(autouse=True)
def bind_logger():
    """ssm_command writes to a request-scoped logger proxy; bind a stdlib
    logger to the contextvar so calls don't fail outside a Flask request."""
    token = _logger_ctxvar.set(logging.getLogger("test"))
    yield
    _logger_ctxvar.reset(token)


@pytest.fixture
def mock_ssm_send(mocker):
    mock_client = mock.MagicMock()
    mock_client.send_command.return_value = {"Command": {"CommandId": "cmd-id"}}
    mock_client.get_command_invocation.return_value = {"Status": "Success"}

    mocker.patch("api.PclusterApiHandler.boto3.client", return_value=mock_client)
    mocker.patch("api.PclusterApiHandler.time.sleep")
    mocker.patch(
        "api.PclusterApiHandler.read_and_delete_ssm_output_from_cloudwatch",
        return_value="",
    )
    return mock_client


def _sent_command(mock_client):
    return mock_client.send_command.call_args.kwargs["Parameters"]["commands"][0]


def test_malicious_user_stays_a_single_argument(mock_ssm_send):
    """A user string with a single quote must not break out of the -l argument."""
    malicious = "ec2-user';touch /tmp/pwned;'"
    ssm_command("us-east-1", "i-1234", malicious, "sacct")

    tokens = shlex.split(_sent_command(mock_ssm_send))
    # Expected shell parse: ['runuser', '-l', <malicious literal>, '-c', 'sacct']
    # If shlex.quote were missing, the shell would see extra tokens / commands
    # from the injected ';touch /tmp/pwned;' portion.
    assert tokens[0:2] == ["runuser", "-l"]
    assert tokens[2] == malicious
    assert tokens[3:] == ["-c", "sacct"]


def test_malicious_run_command_stays_a_single_argument(mock_ssm_send):
    """A run_command with shell metacharacters must be passed as one -c argument."""
    malicious = "sacct';rm -rf /;'"
    ssm_command("us-east-1", "i-1234", "ec2-user", malicious)

    tokens = shlex.split(_sent_command(mock_ssm_send))
    assert tokens == ["runuser", "-l", "ec2-user", "-c", malicious]
