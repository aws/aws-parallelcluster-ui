import pytest
from marshmallow import ValidationError

from api.validation.validators import size_not_exceeding, is_safe_path


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