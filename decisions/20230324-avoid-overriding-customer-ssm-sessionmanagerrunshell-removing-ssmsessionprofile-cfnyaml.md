# Avoid overriding customer SSM-SessionManagerRunShell removing SSMSessionProfile-cfn.yaml

- Status: accepted
- Deciders: Nuraghe team
- Date: 2023-03-24
- Tags: SessionManager, SSM, Shell

## Context
Customer SSM-SessionManagerRunShell gets overridden by PCUI Cloudformation template, possibly causing loss of
customer's SSM shell preferences for the region in cui PCUI is deployed.

## Decision
Remove the cloudformation substack SSMSessionProfile-cfn.yaml.
With this change in place, when customers use the Shell button to connect to an SSM enabled cluster headnode,
they will end up being logged in as the default SSM user (which is `ssm-user`) instead of the "default" ParallelCluster user.
Nothing else will change for them.

## Links <!-- optional -->
- [SSMSessionProfile-cfn.yaml](https://github.com/aws/aws-parallelcluster-ui/blob/1a6260ad60cd6bf5160e9b607e2dea85af9428e7/infrastructure/SSMSessionProfile-cfn.yaml)
