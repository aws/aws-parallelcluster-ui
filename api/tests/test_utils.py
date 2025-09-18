import pytest
from unittest.mock import Mock, patch
from api.utils import read_and_delete_ssm_output_from_cloudwatch, normalize_logs_token


@pytest.fixture
def mock_boto3_client():
    with patch('boto3.client') as mock_client:
        yield mock_client

@pytest.mark.skip("this test is temporarily disabled because it requires refactoring of the logging utilities")
@pytest.mark.parametrize(
    "responses, expected_result, expected_call_count", [
        pytest.param(
            [
                {
                    'events': [
                        {'message': 'line1'},
                        {'message': 'line2'}
                    ],
                    'nextForwardToken': 'token1',
                    'nextBackwardToken': 'token1'
                },
            ],
            "line1\nline2",
            1,
            id="logs_on_single_page"
        ),
        pytest.param(
            [
                {
                    'events': [
                        {'message': 'line1'},
                        {'message': 'line2'}
                    ],
                    'nextForwardToken': 'token1',
                    'nextBackwardToken': 'token2'
                },
                {
                    'events': [
                        {'message': 'line3'}
                    ],
                    'nextForwardToken': 'token2',
                    'nextBackwardToken': 'token2'
                }
            ],
            "line1\nline2\nline3",
            2,
            id="logs_on_multiple_pages"
        ),
        pytest.param(
            [
                {
                    'events': [],
                    'nextForwardToken': 'token1',
                    'nextBackwardToken': 'token1'
                },
            ],
            "",
            1,
            id="empty_logs"
        ),
])
def test_read_and_delete_ssm_output_from_cloudwatch_success(
        mock_boto3_client, responses, expected_result, expected_call_count
):
    mock_logs = Mock()
    mock_logs.get_log_events.side_effect = responses
    mock_boto3_client.return_value = mock_logs

    result = read_and_delete_ssm_output_from_cloudwatch(
        region='us-east-1',
        log_group_name='/aws/ssm/test',
        command_id='cmd-123',
        instance_id='i-123',
    )

    # Assert
    assert result == expected_result
    mock_boto3_client.assert_called_once_with('logs', region_name='us-east-1')
    assert mock_logs.get_log_events.call_count == expected_call_count
    assert mock_logs.delete_log_stream.call_count == 1

@pytest.mark.skip("this test is temporarily disabled because it requires refactoring of the logging utilities")
@pytest.mark.parametrize(
    "input_token, expected_output", [
        pytest.param(
            'f/WHATEVER/s',
            'WHATEVER/s',
            id="forward_token"
        ),
        pytest.param(
            'b/WHATEVER/s',
            'WHATEVER/s',
            id="backward_token"
        ),
    ]
)
def test_normalize_logs_token(input_token, expected_output):
    result = normalize_logs_token(str(input_token))
    assert result == expected_output, f"Failed for input '{input_token}'. Expected '{expected_output}', got '{result}'"



