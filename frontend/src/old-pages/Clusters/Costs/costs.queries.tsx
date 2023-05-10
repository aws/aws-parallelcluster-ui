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

import {AxiosError} from 'axios'
import {useTranslation} from 'react-i18next'
import {useMutation, useQuery, useQueryClient} from 'react-query'
import {
  ActivateCostMonitoring,
  GetCostMonitoringData,
  GetCostMonitoringStatus,
  NotifyFn,
} from '../../../model'
import {composeTimeRange} from './composeTimeRange'
import {useFeatureFlag} from '../../../feature-flags/useFeatureFlag'

export const COST_MONITORING_DATA_QUERY_KEY = ['COST_MONITORING_DATA']
export const COST_MONITORING_STATUS_QUERY_KEY = ['COST_MONITORING_STATUS']

export function useCostMonitoringDataQuery(clusterName: string) {
  const {fromDate, toDate} = composeTimeRange()

  return useQuery(
    [...COST_MONITORING_DATA_QUERY_KEY, clusterName],
    () => GetCostMonitoringData(clusterName, fromDate, toDate),
    {
      /**
       * The upstream service can be costly,
       * we reduce the amount of calls to the minimum
       */
      staleTime: Infinity,
    },
  )
}

export function useCostMonitoringStatus() {
  const isCostMonitoringActive = useFeatureFlag('cost_monitoring')
  return useQuery(
    COST_MONITORING_STATUS_QUERY_KEY,
    () => GetCostMonitoringStatus(),
    {
      enabled: isCostMonitoringActive,
      /**
       * The upstream service can be costly,
       * we reduce the amount of calls to the minimum
       */
      staleTime: Infinity,
    },
  )
}

export function useActivateCostMonitoringMutation(notify: NotifyFn) {
  const {t} = useTranslation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => ActivateCostMonitoring(),
    onSuccess: () => {
      queryClient.setQueryData(COST_MONITORING_STATUS_QUERY_KEY, true)
      notify(t('costMonitoring.activateButton.activationSuccess'))
    },
    onError: (error: AxiosError) => {
      if (error.response) {
        const costExplorerCannotBeAccessed = error.response.status === 405
        const message = costExplorerCannotBeAccessed
          ? t('costMonitoring.activateButton.costExplorerCannotBeAccessed')
          : error.response.data.message
        notify(message, 'error')
      }
    },
  })
}
