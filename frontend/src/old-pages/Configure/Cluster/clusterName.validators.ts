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

import i18next from 'i18next'
import {clearState, getState, setState} from '../../../store'
import {ClusterInfoSummary} from '../../../types/clusters'

const clusterNamePath = ['app', 'wizard', 'clusterName']
const clusterNameErrorPath = [
  'app',
  'wizard',
  'errors',
  'source',
  'clusterName',
]

type ErrorKind = 'empty' | 'existing_name' | 'forbidden_chars'

type ValidateResult = [true] | [false, ErrorKind]

export function validateClusterName(
  clustersList: Set<string>,
  clusterName: string,
): ValidateResult {
  if (!clusterName) {
    return [false, 'empty']
  }

  if (clustersList.has(clusterName)) {
    return [false, 'existing_name']
  }

  if (!/^[a-zA-Z][a-zA-Z0-9-]+$/.test(clusterName)) {
    return [false, 'forbidden_chars']
  }

  return [true]
}

export function validateClusterNameAndSetErrors() {
  const clusterName = getState(clusterNamePath)
  const clusters: ClusterInfoSummary[] = getState(['clusters', 'list']) || []
  const allClusterNames = new Set(clusters.map(c => c.clusterName))

  const [isValid, errorCode] = validateClusterName(allClusterNames, clusterName)

  if (isValid) {
    clearState(clusterNameErrorPath)
    return true
  }

  switch (errorCode) {
    case 'empty':
      setState(
        clusterNameErrorPath,
        i18next.t('wizard.cluster.clusterName.cannotBeBlank'),
      )
      return false
    case 'existing_name':
      setState(
        clusterNameErrorPath,
        i18next.t('wizard.cluster.clusterName.alreadyExists', {clusterName}),
      )
      return false
    case 'forbidden_chars':
      setState(
        clusterNameErrorPath,
        i18next.t('wizard.cluster.clusterName.doesntMatchRegex', {clusterName}),
      )
      return false
    default:
      return false
  }
}
