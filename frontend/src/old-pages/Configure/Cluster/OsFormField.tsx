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

import * as React from 'react'
import {useTranslation} from 'react-i18next'
import {findFirst} from '../../../util'
import {FormField, Select} from '@cloudscape-design/components'
import {setState, useState} from '../../../store'
import {useCallback, useMemo} from 'react'
import {OptionDefinition} from '@cloudscape-design/components/internal/components/option/interfaces'
import {itemToOption} from '../Cluster'

export function OsFormField() {
  const {t} = useTranslation()
  const oses: [string, string][] = [
    ['alinux2', 'Amazon Linux 2'],
    ['centos7', 'CentOS 7'],
    ['ubuntu1804', 'Ubuntu 18.04'],
    ['ubuntu2004', 'Ubuntu 20.04'],
  ]
  const osPath = ['app', 'wizard', 'config', 'Image', 'Os']
  const os = useState(osPath) || 'alinux2'
  const editing = useState(['app', 'wizard', 'editing'])

  const osesOptions = useMemo(() => oses.map(itemToOption), [oses])

  const selectedOs: OptionDefinition | null = useMemo(() => {
    const selectedOsTuple = findFirst(oses, (x: any) => x[0] === os) || null
    return itemToOption(selectedOsTuple)
  }, [os, oses])

  const handleChange = useCallback(({detail}: any) => {
    setState(osPath, detail.selectedOption.value)
  }, [])

  return (
    <>
      <FormField
        label={t('wizard.cluster.os.label')}
        description={t('wizard.cluster.os.description')}
      >
        <Select
          disabled={editing}
          selectedOption={selectedOs}
          onChange={handleChange}
          // @ts-expect-error TS(2322) FIXME: Type '({ label: Element; value: string; } | undefi... Remove this comment to see the full error message
          options={osesOptions}
          selectedAriaLabel={t('wizard.cluster.os.selectedAriaLabel')}
        />
      </FormField>
    </>
  )
}
