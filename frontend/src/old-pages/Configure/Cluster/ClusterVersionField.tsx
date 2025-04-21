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

import {FormField, Input, InputProps} from '@cloudscape-design/components'
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

export function ClusterVersionField() {
  const {t} = useTranslation()
  const version = useState(clusterVersionPath) || ''
  const clusterVersionError = useState(clusterVersionErrorPath)
  const editing = !!useState(editingPath)

  const onChange: NonCancelableEventHandler<InputProps.ChangeDetail> =
    useCallback(({detail}) => {
      setState(clusterVersionPath, detail.value)
    }, [])

  return (
    <FormField
      label={t('wizard.cluster.version.label')}
      constraintText={t('wizard.cluster.version.description')}
      errorText={clusterVersionError}
    >
      <Input
        disabled={editing}
        onChange={onChange}
        value={version}
        placeholder={t('wizard.cluster.version.placeholder')}
      />
    </FormField>
  )
}
