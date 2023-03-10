# Scope down e2e tests

- Status: accepted
- Deciders: Nuraghe team
- Date: 2023-03-10
- Tags: e2e, tests

## Context
Typically, e2e tests consist in simulating user interactions and making sure all the components of the system under test behave as expected. This involves reducing the number of mocks to the minimum (e.g. - only expensive third party APIs).

In the case of PCUI, this would involve a lot of infrastructure being moved (e.g. creating a cluster) and it would add many dependencies to every test (ParallelCluster, the underlying AWS infrastructure, CloudFormation and so on). It would make the tests very costly, with little to no actual improvement in the confidence that PCUI is working as expected.

Last but not least, PC provides a powerful dry-run feature that allows PCUI to quickly verify most of its features.

## Decision
In PCUI, e2e tests will avoid involving costly tests such as an actual cluster creation

## Consequences
- Cheaper, much quicker tests
- More or less the same level of confidence in the stability of PCUI