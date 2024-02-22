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

import {FormField, Tiles, TilesProps} from '@cloudscape-design/components'
import {NonCancelableEventHandler} from '@cloudscape-design/components/internal/events'
import {useCallback} from 'react'
import {useTranslation} from 'react-i18next'
import {useFeatureFlag} from '../../../feature-flags/useFeatureFlag'
import {setState, useState} from '../../../store'

const osPath = ['app', 'wizard', 'config', 'Image', 'Os']

const SUPPORTED_OSES_LIST: TilesProps.TilesDefinition[] = [
  {value: 'alinux2', label: 'Amazon Linux 2'},
  {value: 'centos7', label: 'CentOS 7'},
  {value: 'ubuntu2004', label: 'Ubuntu 20.04'},
]
const UBUNTU18_OS = {value: 'ubuntu1804', label: 'Ubuntu 18.04'}
const RHEL8_OS = {value: 'rhel8', label: 'Red Hat Enterprise Linux 8'}
const UBUNTU22_OS = {value: 'ubuntu2204', label: 'Ubuntu 22.04'}
const RHEL9_OS = {value: 'rhel9', label: 'Red Hat Enterprise Linux 9'}

export function OsFormField() {
  const {t} = useTranslation()
  const editing = useState(['app', 'wizard', 'editing'])
  const selectedOsValue = useState(osPath) || 'alinux2'

  let osesList = useFeatureFlag('rhel8')
    ? SUPPORTED_OSES_LIST.concat(RHEL8_OS)
    : SUPPORTED_OSES_LIST
  osesList = useFeatureFlag('ubuntu1804')
    ? osesList.concat(UBUNTU18_OS)
    : osesList
  osesList = useFeatureFlag('ubuntu2204')
    ? osesList.concat(UBUNTU22_OS)
    : osesList
  osesList = useFeatureFlag('rhel9') ? osesList.concat(RHEL9_OS) : osesList
  osesList = editing ? osesList.map(os => ({...os, disabled: true})) : osesList

  const handleChange: NonCancelableEventHandler<TilesProps.ChangeDetail> =
    useCallback(({detail}) => {
      setState(osPath, detail.value)
    }, [])

  return (
    <>
      <FormField
        label={t('wizard.cluster.os.label')}
        description={t('wizard.cluster.os.description')}
      >
        <Tiles
          items={osesList}
          value={selectedOsValue}
          onChange={handleChange}
        />
      </FormField>
    </>
  )
}
