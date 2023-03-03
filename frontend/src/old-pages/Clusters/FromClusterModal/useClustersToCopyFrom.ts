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

import {SelectProps} from '@cloudscape-design/components'
import {useMemo} from 'react'
import {useState} from '../../../store'
import {ClusterInfoSummary, ClusterStatus} from '../../../types/clusters'

function itemToOption(item: ClusterInfoSummary): SelectProps.Option {
  return {
    label: item.clusterName,
    value: item.clusterName,
  }
}

function matchUpToMinor(semVer1: string, semVer2: string) {
  const [major1, minor1] = semVer1.split('.')
  const [major2, minor2] = semVer2.split('.')

  if (major1 !== major2) return false
  if (minor1 !== minor2) return false

  return true
}

function canCopyFromCluster(
  cluster: ClusterInfoSummary,
  currentVersion: string,
) {
  if (cluster.clusterStatus === ClusterStatus.DeleteInProgress) {
    return false
  }

  if (!matchUpToMinor(cluster.version, currentVersion)) {
    return false
  }

  return true
}

export function useClustersToCopyFrom() {
  const apiVersion = useState(['app', 'version', 'full'])
  const clusters: ClusterInfoSummary[] = useState(['clusters', 'list'])

  return useMemo(() => {
    if (!clusters) {
      return []
    }

    return clusters
      .filter(cluster => canCopyFromCluster(cluster, apiVersion))
      .map(itemToOption)
  }, [apiVersion, clusters])
}
