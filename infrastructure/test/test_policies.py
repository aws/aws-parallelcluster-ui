"""Tests for parallelcluster-ui-policies.yaml."""

import json

import pytest
from cloud_radar.cf.unit import Template

from constants import INFRASTRUCTURE_DIR

# IAM quota for the size of a customer managed policy, whitespace excluded.
MANAGED_POLICY_MAX_CHARS = 6144


@pytest.mark.parametrize(
    "policy_name", ["DeploymentCorePolicy", "DeploymentCognitoPolicy", "DeploymentImageBuilderPolicy"]
)
def test_managed_policy_size_within_quota(policy_name: str):
    template = Template.from_yaml((INFRASTRUCTURE_DIR / "parallelcluster-ui-policies.yaml").resolve(), {})
    document = template.create_stack({}).get_resource(policy_name).get_property_value("PolicyDocument")

    size = len(json.dumps(document, separators=(",", ":")))

    assert size <= MANAGED_POLICY_MAX_CHARS, f"{policy_name} is {size} characters, above the IAM quota"
