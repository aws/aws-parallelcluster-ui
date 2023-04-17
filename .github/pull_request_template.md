<!-- If the PR is tagged for release changelog inclusion, remember to provide a meaningful title, since it will be used as a changelog entry -->
## Description

<!-- Summary of what this PR introduces and possibly why -->

## Changes

<!-- List of relevant changes introduced -->

## How Has This Been Tested?

<!-- The tests you ran to verify your changes -->

## References

<!-- Any link to resources, issues, other PRs that are relevant to this PR -->

## PR Quality Checklist

- [ ] I added tests to new or existing code
- [ ] I removed hardcoded strings and used [`react-i18next`](https://react.i18next.com/) library ([useTranslation hook](https://react.i18next.com/latest/usetranslation-hook) and/or [Trans component](https://react.i18next.com/latest/trans-component)), see an example [here](https://github.com/aws/aws-parallelcluster-ui/commit/a6f1e2aa46b245b5bf7500a04b83195477a5cfa5)
- [ ] I made sure no sensitive info gets logged at any time in the codebase (see [here](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)) (e.g. no user info or details, no stacktraces, etc.)
- [ ] I made sure that any [GitHub issue](https://github.com/aws/aws-parallelcluster-ui/issues) solved by this PR is correctly linked
- [ ] I checked that infrastructure/update_infrastructure.sh runs without any error
- [ ] I checked that `npm run build` builds without any error
- [ ] I checked that clusters are listed correctly
- [ ] I checked that a new cluster can be created (config is produced and dry run passes)
- [ ] I checked that login and logout work as expected

In order to increase the likelihood of your contribution being accepted, please make sure you have read both the [Contributing Guidelines](../CONTRIBUTING.md) and the [Project Guidelines](../PROJECT_GUIDELINES.md)

By submitting this pull request, I confirm that you can use, modify, copy, and redistribute this contribution, under the terms of your choice.
