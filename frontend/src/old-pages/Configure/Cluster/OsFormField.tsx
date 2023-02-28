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
import {setState, useState} from '../../../store'

const osPath = ['app', 'wizard', 'config', 'Image', 'Os']

const SUPPORTED_OSES_LIST: TilesProps.TilesDefinition[] = [
  {value: 'alinux2', label: 'Amazon Linux 2'},
  {value: 'centos7', label: 'CentOS 7'},
  {value: 'ubuntu1804', label: 'Ubuntu 18.04'},
  {value: 'ubuntu2004', label: 'Ubuntu 20.04'},
]

export function OsFormField() {
  const {t} = useTranslation()
  const editing = useState(['app', 'wizard', 'editing'])
  const selectedOsValue = useState(osPath) || 'alinux2'

  const osesList = editing
    ? SUPPORTED_OSES_LIST.map(os => ({...os, disabled: true}))
    : SUPPORTED_OSES_LIST

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
