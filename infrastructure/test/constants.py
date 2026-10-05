"""Constants shared across parallelcluster-ui cloud-radar tests."""

from pathlib import Path

INFRASTRUCTURE_DIR = Path(__file__).parent.parent

BASE_PARAMS = {
    "AdminUserEmail": "firstname@email.com",
    "Version": "3.15.0",
}

CFN_TEMPLATES = [
    # Templates used for production
    "parallelcluster-ui.yaml",
    "parallelcluster-ui-cognito.yaml",

    # Templates used for testing
    "github-env-setup.yml",
    "github-env-setup-prod.yml",
    "custom-domain/custom-domain.yaml",
    "private-deployment/private-deployment.yaml",
    "slurm-accounting/accounting-cluster-template.yaml",
]
