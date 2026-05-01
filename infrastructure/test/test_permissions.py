"""Permissions boundary tests for parallelcluster-ui.yaml."""

import pytest
from cloud_radar.cf.unit import Template

from constants import BASE_PARAMS
from helpers import iam_roles_with_boundary


@pytest.mark.parametrize(
    "boundary_arn",
    [
        pytest.param(
            "arn:aws:iam::123456789012:policy/parallelcluster-ui-permissions-boundary",
            id="with-boundary",
        ),
        pytest.param(None, id="without-boundary"),
    ],
)
def test_permissions_boundary(template: Template, boundary_arn: str | None):
    """PermissionsBoundaryPolicy must be forwarded to the Cognito nested stack
    and applied to every IAM Role when specified, and absent when not."""
    params = {**BASE_PARAMS}
    if boundary_arn is not None:
        params["PermissionsBoundaryPolicy"] = boundary_arn

    stack = template.create_stack(params)

    # Cognito nested stack parameter
    cognito = stack.get_resource("Cognito")
    cognito_params = cognito.get_property_value("Parameters")

    # IAM Roles with a PermissionsBoundary property
    roles_with_boundary = iam_roles_with_boundary(stack)

    if boundary_arn is not None:
        assert cognito_params.get("PermissionsBoundaryPolicy") == boundary_arn, (
            "PermissionsBoundaryPolicy was not forwarded to the Cognito nested stack"
        )

        assert roles_with_boundary, "Expected at least one IAM Role with a boundary"
        for name, definition in roles_with_boundary:
            boundary = definition["Properties"]["PermissionsBoundary"]
            assert boundary == boundary_arn, (
                f"Role {name} has PermissionsBoundary {boundary!r}, "
                f"expected {boundary_arn!r}"
            )
    else:
        assert cognito_params.get("PermissionsBoundaryPolicy", "") == "", (
            "Expected Cognito PermissionsBoundaryPolicy to be empty when unset"
        )

        for name, definition in roles_with_boundary:
            # cloud-radar keeps AWS::NoValue as the empty string, so the
            # property may still appear with a falsy value.
            boundary = definition["Properties"].get("PermissionsBoundary", "")
            assert not boundary, (
                f"Role {name} received PermissionsBoundary {boundary!r} "
                f"when none was supplied"
            )
