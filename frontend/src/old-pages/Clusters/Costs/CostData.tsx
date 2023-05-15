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

import {
  BarChart,
  BarChartProps,
  Button,
  Container,
  Header,
  SpaceBetween,
} from '@cloudscape-design/components'
import {useCallback, useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import EmptyState from '../../../components/EmptyState'
import {consoleDomain, useState} from '../../../store'
import {useCostMonitoringDataQuery} from './costs.queries'
import {CostMonitoringData} from './costs.types'
import {toShortDollarAmount} from './valueFormatter'
import i18next from 'i18next'

interface Props {
  clusterName: string
}

type XAxisValueType = string

function rotateArray<T = unknown>(arr: T[], k: number): T[] {
  return arr.slice(k).concat(arr.slice(0, k))
}

function rotateToCurrentMonth(months: string[], today = new Date()): string[] {
  const currentMonthIndex = today.getMonth()
  const rotatedMonths = rotateArray(months, currentMonthIndex + 1)

  return rotatedMonths
}

function dataIsAllZeroes(data: CostMonitoringData[]) {
  const upTo12points = data.slice(Math.max(data.length - 12, 0))
  return upTo12points.every(data => data.amount === 0)
}

function toSeriesData(months: string[], data: CostMonitoringData[]) {
  const upTo12points = data.slice(Math.max(data.length - 12, 0))
  const mapped = upTo12points.map(({amount}, index) => ({
    x: months[index],
    y: amount,
  }))
  return mapped
}

function toStatusType(
  isLoading: boolean,
  isError: boolean,
  isSuccess: boolean,
): BarChartProps<XAxisValueType>['statusType'] {
  if (isLoading) return 'loading'
  if (isError) return 'error'
  if (isSuccess) return 'finished'
  return undefined
}

const months = [
  i18next.t('costMonitoring.costData.chart.months.jan'),
  i18next.t('costMonitoring.costData.chart.months.feb'),
  i18next.t('costMonitoring.costData.chart.months.mar'),
  i18next.t('costMonitoring.costData.chart.months.apr'),
  i18next.t('costMonitoring.costData.chart.months.may'),
  i18next.t('costMonitoring.costData.chart.months.jun'),
  i18next.t('costMonitoring.costData.chart.months.jul'),
  i18next.t('costMonitoring.costData.chart.months.aug'),
  i18next.t('costMonitoring.costData.chart.months.sep'),
  i18next.t('costMonitoring.costData.chart.months.oct'),
  i18next.t('costMonitoring.costData.chart.months.nov'),
  i18next.t('costMonitoring.costData.chart.months.dec'),
]

function buildCostExplorerLink(domain: string, clusterName: string) {
  const uri = `${domain}/cost-management/home#/cost-explorer?granularity=Monthly&historicalRelativeRange=LAST_12_MONTHS&groupBy=[]&filter=[{"dimension":{"id":"TagKey","displayValue":"Tag"},"operator":"INCLUDES","values":[{"value":"${clusterName}"}],"growableValue":{"value":"parallelcluster:cluster-name","displayValue":"parallelcluster:cluster-name"}}]`

  return encodeURI(uri)
}

export function CostData({clusterName}: Props) {
  const {t} = useTranslation()
  const defaultRegion = useState(['aws', 'region'])
  const region = useState(['app', 'selectedRegion']) || defaultRegion

  const {data, refetch, isLoading, isError, isSuccess} =
    useCostMonitoringDataQuery(clusterName)

  const last12Months = useMemo(() => rotateToCurrentMonth(months), [])

  const isEmpty = data && dataIsAllZeroes(data)

  const series: BarChartProps<XAxisValueType>['series'] = useMemo(
    () =>
      isSuccess && !isEmpty
        ? [
            {
              title: clusterName,
              type: 'bar',
              data: toSeriesData(last12Months, data),
              valueFormatter: (value: number) =>
                t('global.intlCurrency', {value}),
            },
          ]
        : [],
    [clusterName, data, isEmpty, isSuccess, last12Months, t],
  )

  const domain = consoleDomain(region)
  const costExplorerHref = buildCostExplorerLink(domain, clusterName)

  const budgetsHref = `${domain}/billing/home#/budgets`

  const i18nStrings: BarChartProps<XAxisValueType>['i18nStrings'] = useMemo(
    () => ({
      yTickFormatter: toShortDollarAmount,
    }),
    [],
  )

  const onRecoveryClick = useCallback(() => {
    refetch()
  }, [refetch])

  return (
    <Container
      header={
        <Header
          variant="h2"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                iconName="external"
                href={costExplorerHref}
                target="_blank"
              >
                {t('costMonitoring.costData.viewInCostExplorer')}
              </Button>
              <Button iconName="external" href={budgetsHref} target="_blank">
                {t('costMonitoring.costData.viewBudgets')}
              </Button>
            </SpaceBetween>
          }
        >
          {t('costMonitoring.costData.title')}
        </Header>
      }
    >
      <BarChart
        hideFilter
        series={series}
        yTitle={t('costMonitoring.costData.chart.yTitle')}
        xTitle={t('costMonitoring.costData.chart.xTitle')}
        xScaleType="categorical"
        xDomain={last12Months}
        statusType={toStatusType(isLoading, isError, isSuccess)}
        errorText={t('costMonitoring.costData.chart.errorText')}
        loadingText={t('costMonitoring.costData.chart.loadingText')}
        recoveryText={t('costMonitoring.costData.chart.recoveryText')}
        onRecoveryClick={onRecoveryClick}
        i18nStrings={i18nStrings}
        /**
         * Limit the height of the bar chart
         * to better fit inside the SplitPanel
         */
        height={350}
        empty={
          <EmptyState
            title={t('costMonitoring.costData.chart.empty.title')}
            subtitle={t('costMonitoring.costData.chart.empty.subtitle')}
          />
        }
      />
    </Container>
  )
}
