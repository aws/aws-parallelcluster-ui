"""API Gateway policy tests for parallelcluster-ui.yaml."""

import pytest
from cloud_radar.cf.unit import Template

from constants import BASE_PARAMS
from helpers import policy_statements


@pytest.mark.parametrize(
    "vpc_endpoint_id",
    [
        pytest.param("vpce-0123456789abcdef0", id="private"),
        pytest.param(None, id="public"),
    ],
)
def test_api_gateway_policy(template: Template, vpc_endpoint_id: str | None):
    """ApiGatewayRestApi.Policy must deny non-VPCE traffic when a
    VpcEndpointId is specified, and allow all traffic when it is not."""
    params = {**BASE_PARAMS}
    if vpc_endpoint_id is not None:
        params["VpcEndpointId"] = vpc_endpoint_id

    stack = template.create_stack(params)

    api = stack.get_resource("ApiGatewayRestApi")
    policy = api.get_property_value("Policy")
    statements = policy_statements(policy)

    # Both modes must contain an unconditional Allow.
    allow = next((s for s in statements if s.get("Effect") == "Allow"), None)
    assert allow is not None, "Expected an Allow statement"
    assert allow["Action"] == "execute-api:Invoke"
    assert allow["Principal"] == "*"
    assert allow["Resource"] == "execute-api:/*"

    if vpc_endpoint_id is not None:
        # Private mode: Deny + Allow
        assert len(statements) == 2, f"Expected 2 statements, got {statements}"

        deny = next((s for s in statements if s.get("Effect") == "Deny"), None)
        assert deny is not None, "Expected a Deny statement in private mode"
        assert deny["Action"] == "execute-api:Invoke"
        assert deny["Principal"] == "*"
        assert deny["Resource"] == "execute-api:/*"
        assert deny["Condition"] == {
            "StringNotEquals": {"aws:sourceVpce": vpc_endpoint_id}
        }
    else:
        # Public mode: Allow only, no Deny, no Condition on Allow
        assert len(statements) == 1, (
            f"Expected 1 statement in public mode, got {statements}"
        )
        assert "Condition" not in allow, "Public-mode Allow must not carry a Condition"
        assert not any(
            s.get("Effect") == "Deny" for s in statements
        ), "Public-mode policy must not contain any Deny statements"
