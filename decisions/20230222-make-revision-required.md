# Make revision required

- Status: accepted
- Deciders: Nuraghe Team
- Tags: versioning, pcui

## Context
Currently, the versioning schema adopted takes inspiration from [CalVer](https://calver.org/) and it is composed of Year, Month and Revision number.

As of today, Revision number is optional, and it is not automatically added by the release workflow.

## Decision
We are making the Revision required, thus the new schema is now YYYY.MM.REVISION

## Consequences
It is now possible to automatically release patches, without manual interventions. Revision number is taken from the GitHub ref name, as implemented with [#55](https://github.com/aws/aws-parallelcluster-ui/pull/55)

## Links <!-- optional -->
- [PR](https://github.com/aws/aws-parallelcluster-ui/pull/55) 
- Supersedes [20230125-pcui-versioning-strategy](20230125-pcui-versioning-strategy.md)
