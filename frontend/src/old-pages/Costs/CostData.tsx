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
import EmptyState from '../../components/EmptyState'
import {consoleDomain, useState} from '../../store'
import {useCostMonitoringDataQuery} from './costs.queries'
import {CostMonitoringData} from './costs.types'
import {toFullDollarAmount, toShortDollarAmount} from './valueFormatter'

interface Props {
  clusterName: string
}

type XAxisValueType = string

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

export function CostData({clusterName}: Props) {
  const {t} = useTranslation()
  const defaultRegion = useState(['aws', 'region'])
  const region = useState(['app', 'selectedRegion']) || defaultRegion

  const {data, refetch, isLoading, isError, isSuccess} =
    useCostMonitoringDataQuery(clusterName)

  const months = useMemo(
    () => [
      t('costMonitoring.costData.chart.months.jan'),
      t('costMonitoring.costData.chart.months.feb'),
      t('costMonitoring.costData.chart.months.mar'),
      t('costMonitoring.costData.chart.months.apr'),
      t('costMonitoring.costData.chart.months.may'),
      t('costMonitoring.costData.chart.months.jun'),
      t('costMonitoring.costData.chart.months.jul'),
      t('costMonitoring.costData.chart.months.aug'),
      t('costMonitoring.costData.chart.months.sep'),
      t('costMonitoring.costData.chart.months.oct'),
      t('costMonitoring.costData.chart.months.nov'),
      t('costMonitoring.costData.chart.months.dec'),
    ],
    [t],
  )

  const series: BarChartProps<XAxisValueType>['series'] = useMemo(
    () =>
      isSuccess
        ? [
            {
              title: t('costMonitoring.costData.chart.title'),
              type: 'bar',
              data: toSeriesData(months, data),
              valueFormatter: toFullDollarAmount,
            },
          ]
        : [],
    [data, isSuccess, months, t],
  )

  const domain = consoleDomain(region)
  const costExplorerHref = `${domain}/cost-management/home#/cost-explorer`
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
        xDomain={months}
        statusType={toStatusType(isLoading, isError, isSuccess)}
        errorText={t('costMonitoring.costData.chart.errorText')}
        loadingText={t('costMonitoring.costData.chart.loadingText')}
        recoveryText={t('costMonitoring.costData.chart.recoveryText')}
        onRecoveryClick={onRecoveryClick}
        i18nStrings={i18nStrings}
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
