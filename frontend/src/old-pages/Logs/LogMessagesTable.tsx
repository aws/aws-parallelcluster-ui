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

import {useCollection} from '@cloudscape-design/collection-hooks'
import {
  Button,
  Header,
  Pagination,
  Table,
  TableProps,
  TextFilter,
} from '@cloudscape-design/components'
import {useCallback, useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {useQuery} from 'react-query'
import DateView from '../../components/date/DateView'
import EmptyState from '../../components/EmptyState'
import {ListClusterLogEvents} from '../../model'
import {extendCollectionsOptions} from '../../shared/extendCollectionsOptions'
import {LogEvent} from '../../types/logs'

interface Props {
  clusterName: string
  logStreamName?: string
}

export function LogMessagesTable({clusterName, logStreamName}: Props) {
  const {t} = useTranslation()
  const canFetchMessages = !!logStreamName
  const {
    data = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery(
    ['CLUSTER_LOG_EVENTS', clusterName, logStreamName],
    () => ListClusterLogEvents(clusterName, logStreamName!),
    {enabled: canFetchMessages},
  )

  const columnDefinitions: TableProps.ColumnDefinition<LogEvent>[] = useMemo(
    () => [
      {
        id: 'timestamp',
        header: t('clusterLogs.logEvents.columns.timestamp'),
        cell: item => <DateView date={item.timestamp} />,
        sortingField: 'timestamp',
      },
      {
        id: 'message',
        header: t('clusterLogs.logEvents.columns.message'),
        cell: item => item.message,
        sortingField: 'message',
      },
    ],
    [t],
  )

  const {
    items,
    filteredItemsCount,
    collectionProps,
    filterProps,
    paginationProps,
  } = useCollection(
    data,
    extendCollectionsOptions({
      filtering: {
        empty: (
          <EmptyState
            title={t('clusterLogs.logEvents.filtering.empty.title')}
            subtitle={t('clusterLogs.logEvents.filtering.empty.subtitle')}
          />
        ),
        noMatch: (
          <EmptyState
            title={t('clusterLogs.logEvents.filtering.noMatch.title')}
            subtitle={t('clusterLogs.logEvents.filtering.noMatch.subtitle')}
          />
        ),
      },
      sorting: {
        defaultState: {
          sortingColumn: {
            sortingField: 'timestamp',
          },
          isDescending: true,
        },
      },
      selection: {},
    }),
  )

  const messagesCountText =
    data.length > 0 ? `(${data.length}+)` : `(${data.length})`

  const onRefreshClick = useCallback(() => {
    refetch()
  }, [refetch])

  return (
    <Table
      {...collectionProps}
      loading={isLoading}
      loadingText={t('clusterLogs.logEvents.loadingText')}
      columnDefinitions={columnDefinitions}
      items={items}
      trackBy="message"
      header={
        <Header
          counter={messagesCountText}
          actions={
            <Button
              disabled={!canFetchMessages}
              onClick={onRefreshClick}
              loading={isFetching}
            >
              {t('clusterLogs.logEvents.actions.refresh')}
            </Button>
          }
        >
          {t('clusterLogs.logEvents.title')}
        </Header>
      }
      pagination={<Pagination {...paginationProps} />}
      filter={
        <TextFilter
          {...filterProps}
          countText={t('clusterLogs.logEvents.filtering.countText', {
            filteredItemsCount,
          })}
          filteringPlaceholder={t(
            'clusterLogs.logEvents.filtering.filteringPlaceholder',
          )}
        />
      }
    />
  )
}
