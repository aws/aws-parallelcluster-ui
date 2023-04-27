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

import {Button} from '@cloudscape-design/components'
import {useCallback} from 'react'
import {useTranslation} from 'react-i18next'
import {useQuery} from 'react-query'
import {useFeatureFlag} from '../../feature-flags/useFeatureFlag'
import {GetCostMonitoringStatus, notify} from '../../model'
import {
  COST_MONITORING_STATUS_QUERY_KEY,
  useActivateCostMonitoringMutation,
} from './costs.queries'

export function EnableCostMonitoringButton() {
  const {t} = useTranslation()
  const isCostMonitoringActive = useFeatureFlag('cost_monitoring')
  const isExperimentalModeActive = useFeatureFlag('experimental')
  const canFetchStatus = isExperimentalModeActive && isCostMonitoringActive

  const {data: costMonitoringStatus, isLoading} = useQuery(
    COST_MONITORING_STATUS_QUERY_KEY,
    () => GetCostMonitoringStatus(),
    {enabled: canFetchStatus},
  )
  const costMonitoringStatusMutation = useActivateCostMonitoringMutation(notify)

  const onClick = useCallback(() => {
    costMonitoringStatusMutation.mutate()
  }, [costMonitoringStatusMutation])

  if (
    isLoading ||
    costMonitoringStatus ||
    !isExperimentalModeActive ||
    !isCostMonitoringActive
  )
    return null

  return (
    <Button onClick={onClick}>
      {t('costMonitoring.activateButton.label')}
    </Button>
  )
}
