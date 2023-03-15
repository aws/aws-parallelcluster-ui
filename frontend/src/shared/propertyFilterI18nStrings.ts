// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
// with the License. A copy of the License is located at
//
// http://aws.amazon.com/apache2.0/
//
// or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
// limitations under the License.

import {PropertyFilterProps} from '@cloudscape-design/components'
import {TFunction} from 'react-i18next'

export function propertyFilterI18nStrings(
  t: TFunction,
): PropertyFilterProps.I18nStrings {
  return {
    filteringAriaLabel: t('global.propertyFilter.filteringAriaLabel'),
    dismissAriaLabel: t('global.propertyFilter.dismissAriaLabel'),
    filteringPlaceholder: t('global.propertyFilter.filteringPlaceholder'),
    groupValuesText: t('global.propertyFilter.groupValuesText'),
    groupPropertiesText: t('global.propertyFilter.groupPropertiesText'),
    operatorsText: t('global.propertyFilter.operatorsText'),
    operationAndText: t('global.propertyFilter.operationAndText'),
    operationOrText: t('global.propertyFilter.operationOrText'),
    operatorLessText: t('global.propertyFilter.operatorLessText'),
    operatorLessOrEqualText: t('global.propertyFilter.operatorLessOrEqualText'),
    operatorGreaterText: t('global.propertyFilter.operatorGreaterText'),
    operatorGreaterOrEqualText: t(
      'global.propertyFilter.operatorGreaterOrEqualText',
    ),
    operatorContainsText: t('global.propertyFilter.operatorContainsText'),
    operatorDoesNotContainText: t(
      'global.propertyFilter.operatorDoesNotContainText',
    ),
    operatorEqualsText: t('global.propertyFilter.operatorEqualsText'),
    operatorDoesNotEqualText: t(
      'global.propertyFilter.operatorDoesNotEqualText',
    ),
    editTokenHeader: t('global.propertyFilter.editTokenHeader'),
    propertyText: t('global.propertyFilter.propertyText'),
    operatorText: t('global.propertyFilter.operatorText'),
    valueText: t('global.propertyFilter.valueText'),
    cancelActionText: t('global.propertyFilter.cancelActionText'),
    applyActionText: t('global.propertyFilter.applyActionText'),
    allPropertiesLabel: t('global.propertyFilter.allPropertiesLabel'),
    clearFiltersText: 'Clear filters',
    removeTokenButtonAriaLabel: token =>
      t('global.propertyFilter.removeTokenButtonAriaLabel', {
        propertyKey: token.propertyKey,
        operator: token.operator,
        value: token.value,
      }),
    enteredTextLabel: text =>
      t('global.propertyFilter.enteredTextLabel', {text}),
  }
}
