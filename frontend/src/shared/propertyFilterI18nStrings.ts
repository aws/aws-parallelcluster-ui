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
