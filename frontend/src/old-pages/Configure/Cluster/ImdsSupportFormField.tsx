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

import {FormField, Select, SelectProps} from '@cloudscape-design/components'
import {NonCancelableEventHandler} from '@cloudscape-design/components/internal/events'
import {useCallback, useEffect, useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {useFeatureFlag} from '../../../feature-flags/useFeatureFlag'
import {setState, useState} from '../../../store'

const imdsSupportPath = ['app', 'wizard', 'config', 'Imds', 'ImdsSupport']

const DEFAULT_IMDS_SUPPORT_VALUE = 'v2.0'

export function ImdsSupportFormField() {
  const {t} = useTranslation()
  const isImdsSupportActive = useFeatureFlag('imds_support')
  const editing: boolean = useState(['app', 'wizard', 'editing'])
  const imdsSupport: string | null = useState(imdsSupportPath)

  useEffect(() => {
    if (isImdsSupportActive && imdsSupport === null)
      setState(imdsSupportPath, DEFAULT_IMDS_SUPPORT_VALUE)
  }, [imdsSupport, isImdsSupportActive])

  const options = useMemo(
    () => [
      {value: 'v1.0', label: t('wizard.cluster.imdsSupport.values.version10')},
      {value: 'v2.0', label: t('wizard.cluster.imdsSupport.values.version20')},
    ],
    [t],
  )

  const selectedOption =
    options.find(({value}) => value === imdsSupport) || null

  const onChange: NonCancelableEventHandler<SelectProps.ChangeDetail> =
    useCallback(({detail}) => {
      setState(imdsSupportPath, detail.selectedOption.value)
    }, [])

  if (!isImdsSupportActive) {
    return null
  }

  return (
    <FormField
      label={t('wizard.cluster.imdsSupport.label')}
      description={t('wizard.cluster.imdsSupport.description')}
    >
      <Select
        disabled={editing}
        selectedOption={selectedOption}
        onChange={onChange}
        options={options}
        placeholder={t('wizard.cluster.imdsSupport.placeholder')}
      />
    </FormField>
  )
}
