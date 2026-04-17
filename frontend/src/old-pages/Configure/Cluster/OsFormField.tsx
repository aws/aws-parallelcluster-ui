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
import {AvailableFeature} from '../../../feature-flags/types'
import {useFeatureFlag} from '../../../feature-flags/useFeatureFlag'
import {setState, useState} from '../../../store'

const osPath = ['app', 'wizard', 'config', 'Image', 'Os']

interface OsDefinition extends TilesProps.TilesDefinition {
  feature: AvailableFeature
}

const ALL_OSES: OsDefinition[] = [
  {value: 'alinux2', label: 'Amazon Linux 2', feature: 'alinux2'},
  {value: 'alinux2023', label: 'Amazon Linux 2023', feature: 'alinux2023'},
  {value: 'centos7', label: 'CentOS 7', feature: 'centos7'},
  {value: 'ubuntu1804', label: 'Ubuntu 18.04', feature: 'ubuntu1804'},
  {value: 'ubuntu2004', label: 'Ubuntu 20.04', feature: 'ubuntu2004'},
  {value: 'ubuntu2204', label: 'Ubuntu 22.04', feature: 'ubuntu2204'},
  {value: 'ubuntu2404', label: 'Ubuntu 24.04', feature: 'ubuntu2404'},
  {value: 'rhel8', label: 'Red Hat Enterprise Linux 8', feature: 'rhel8'},
  {value: 'rhel9', label: 'Red Hat Enterprise Linux 9', feature: 'rhel9'},
  {value: 'rocky8', label: 'Rocky Linux 8', feature: 'rocky8'},
  {value: 'rocky9', label: 'Rocky Linux 9', feature: 'rocky9'},
]

function useAvailableOses(): TilesProps.TilesDefinition[] {
  const flags: Record<string, boolean> = {
    alinux2: useFeatureFlag('alinux2'),
    alinux2023: useFeatureFlag('alinux2023'),
    centos7: useFeatureFlag('centos7'),
    ubuntu1804: useFeatureFlag('ubuntu1804'),
    ubuntu2004: useFeatureFlag('ubuntu2004'),
    ubuntu2204: useFeatureFlag('ubuntu2204'),
    ubuntu2404: useFeatureFlag('ubuntu2404'),
    rhel8: useFeatureFlag('rhel8'),
    rhel9: useFeatureFlag('rhel9'),
    rocky8: useFeatureFlag('rocky8'),
    rocky9: useFeatureFlag('rocky9'),
  }

  return ALL_OSES
    .filter(os => flags[os.feature])
    .map(({feature: _, ...rest}) => rest)
}

export function OsFormField() {
  const {t} = useTranslation()
  const editing = useState(['app', 'wizard', 'editing'])
  const selectedOsValue = useState(osPath) || 'alinux2'

  let osesList = useAvailableOses()
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
