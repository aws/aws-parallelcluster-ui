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

import React, {useCallback} from 'react'
import {useTranslation} from 'react-i18next'
import {FormField, Select, SelectProps} from '@cloudscape-design/components'
import {DeletionPolicy} from '../Storage.types'
import InfoLink from '../../../components/InfoLink'
import TitleDescriptionHelpPanel from '../../../components/help-panel/TitleDescriptionHelpPanel'
import {useMemo} from 'react'
import {NonCancelableEventHandler} from '@cloudscape-design/components/internal/events'
import {OptionDefinition} from '@cloudscape-design/components/internal/components/option/interfaces'

interface Props {
  options: DeletionPolicy[]
  value: DeletionPolicy
  onDeletionPolicyChange: (policy: DeletionPolicy) => void
}

function toOption(value: DeletionPolicy): OptionDefinition {
  return {
    label: value,
    value,
  }
}

export function DeletionPolicyFormField({
  options,
  value,
  onDeletionPolicyChange,
}: Props) {
  const {t} = useTranslation()

  const deletionPolicies: DeletionPolicy[] = options
  const selectedOption = toOption(value)

  const deletionFooterLinks = useMemo(
    () => [
      {
        title: t('wizard.storage.instance.deletionPolicy.fsxLink.title'),
        href: t('wizard.storage.instance.deletionPolicy.fsxLink.href'),
      },
      {
        title: t('wizard.storage.instance.deletionPolicy.efsLink.title'),
        href: t('wizard.storage.instance.deletionPolicy.efsLink.href'),
      },
      {
        title: t('wizard.storage.instance.deletionPolicy.ebsLink.title'),
        href: t('wizard.storage.instance.deletionPolicy.ebsLink.href'),
      },
    ],
    [t],
  )

  const onChange: NonCancelableEventHandler<SelectProps.ChangeDetail> =
    useCallback(
      ({detail}) => {
        onDeletionPolicyChange(detail.selectedOption.value as DeletionPolicy)
      },
      [onDeletionPolicyChange],
    )

  return (
    <FormField
      label={t('wizard.storage.instance.deletionPolicy.label')}
      info={
        <InfoLink
          helpPanel={
            <TitleDescriptionHelpPanel
              title={t('wizard.storage.instance.deletionPolicy.label')}
              description={t('wizard.storage.instance.deletionPolicy.help')}
              footerLinks={deletionFooterLinks}
            />
          }
        />
      }
    >
      <Select
        selectedOption={selectedOption}
        onChange={onChange}
        options={deletionPolicies.map(toOption)}
      />
    </FormField>
  )
}
