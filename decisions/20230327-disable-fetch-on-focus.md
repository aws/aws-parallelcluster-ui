# Disable fetch on focus

- Status: accepted
- Tags: frontend, data, react-query

## Context
[`react-query`](https://github.com/tanstack/query) by default re-fetches active queries on window focus. This causes the UI to activate its loading animations, if there's any. This is a good behaviour for a PWA or other specific type of data visualizion, but it's less relevant for PCUI.

## Decision
We [disabled](https://github.com/aws/aws-parallelcluster-ui/pull/126/commits/1e60ffaf2532b87353e283139b5d790622b1fd5d) this default behaviour, and will activate on a per-query basis in case of need.

## Consequences
Data needs to intentionally refreshed either by developers or by users via an appropriate Refresh button.