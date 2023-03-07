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

const clusterNamePath = ['app', 'wizard', 'clusterName']
const clusterNameErrorPath = [
  'app',
  'wizard',
  'errors',
  'source',
  'clusterName',
]

export function ClusterNameField() {
  const {t} = useTranslation()
  const clusterName = useState(clusterNamePath) || ''
  const clusterNameError = useState(clusterNameErrorPath)

  const onChange: NonCancelableEventHandler<InputProps.ChangeDetail> =
    useCallback(({detail}) => {
      setState(clusterNamePath, detail.value)
    }, [])

  return (
    <FormField
      label={t('wizard.cluster.clusterName.label')}
      constraintText={t('wizard.cluster.clusterName.description')}
      errorText={clusterNameError}
    >
      <Input
        onChange={onChange}
        value={clusterName}
        placeholder={t('wizard.cluster.clusterName.placeholder')}
      />
    </FormField>
  )
}
