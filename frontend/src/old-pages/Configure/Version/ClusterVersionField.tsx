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

import {
  FormField,
  Input,
  InputProps,
  NonCancelableCustomEvent,
  Select,
  SelectProps
} from '@cloudscape-design/components'
import {NonCancelableEventHandler} from '@cloudscape-design/components/internal/events'
import {useCallback} from 'react'
import {useTranslation} from 'react-i18next'
import {setState, useState} from '../../../store'

const clusterVersionPath = ['app', 'wizard', 'version']
const clusterVersionErrorPath = [
  'app',
  'wizard',
  'errors',
  'source',
  'version',
]
const editingPath = ['app', 'wizard', 'editing']

interface ClusterVersionFieldProps {
  hideLabel?: boolean;
}

export function ClusterVersionField({ hideLabel = false }: ClusterVersionFieldProps) {
  const {t} = useTranslation()
  const version = useState(clusterVersionPath) || ''
  const clusterVersionError = useState(clusterVersionErrorPath)
  const editing = !!useState(editingPath)
  const versions = useState(['app', 'version', 'full'])

  const options = (versions || []).map((version: string) => ({
    label: version,
    value: version
  }))

  const onChange = useCallback(
      ({detail}: NonCancelableCustomEvent<SelectProps.ChangeDetail>) => {
        setState(clusterVersionPath, detail.selectedOption.value)
      },
      []
  )

  return (
      <FormField
          label={!hideLabel ? t('wizard.version.label') : undefined}
          description={!hideLabel ? t('wizard.version.description') : undefined}
          errorText={clusterVersionError}
      >
        <Select
            disabled={editing}
            onChange={onChange}
            selectedOption={
              version
                  ? {label: version, value: version}
                  : null
            }
            options={options}
            placeholder={t('wizard.version.placeholder')}
        />
      </FormField>
  )
}
