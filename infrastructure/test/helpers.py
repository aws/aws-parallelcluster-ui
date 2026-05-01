"""Helper functions for parallelcluster-ui cloud-radar tests."""

from typing import Any, List, Tuple


def policy_statements(policy: Any) -> List[dict]:
    """Extract and validate the Statement list from a policy document."""
    assert isinstance(policy, dict), f"Policy should be a dict, got {type(policy)}"
    statements = policy.get("Statement")
    assert isinstance(statements, list), "Policy.Statement should be a list"
    return statements


def iam_roles_with_boundary(stack) -> List[Tuple[str, dict]]:
    """Return (name, resource) for every IAM Role that declares a
    PermissionsBoundary property in its Properties.

    This intentionally ignores roles that never set the property (e.g.
    ApiVersionMapFunctionRole) so we only assert against the roles that the
    template is responsible for wiring the boundary into.
    """
    results = []
    roles = stack.get_resources_of_type("AWS::IAM::Role")
    for name, definition in roles.items():
        properties = definition.get("Properties", {})
        if "PermissionsBoundary" in properties:
            results.append((name, definition))
    return results
