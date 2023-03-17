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
  Header,
  Pagination,
  PropertyFilter,
  Table,
  TableProps,
} from '@cloudscape-design/components'
import {NonCancelableEventHandler} from '@cloudscape-design/components/internal/events'
import React, {useCallback, useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {useQueries} from 'react-query'
import DateView from '../../components/date/DateView'
import EmptyState from '../../components/EmptyState'
import {DescribeCluster, ListClusterLogStreams} from '../../model'
import {extendCollectionsOptions} from '../../shared/extendCollectionsOptions'
import {usePropertyFilterI18nStrings} from '../../shared/propertyFilterI18nStrings'
import {useState} from '../../store'
import {Instance, NodeType} from '../../types/instances'
import {LogStreamView} from '../../types/logs'
import {withNodeType} from './withNodeType'

interface Props {
  clusterName: string
  onLogStreamSelect: (logStreamName: string) => void
}

export function LogStreamsTable({clusterName, onLogStreamSelect}: Props) {
  const {t} = useTranslation()
  const [selectedItems, setSelectedItems] = React.useState<LogStreamView[]>([])
  const headNode: Instance | null = useState([
    'clusters',
    'index',
    clusterName,
    'headNode',
  ])

  const [describeClusterQuery, logStreamsQuery] = useQueries([
    {
      queryKey: 'DECRIBE_CLUSTER',
      queryFn: () => DescribeCluster(clusterName),
      enabled: !headNode,
    },
    {
      queryKey: 'CLUSTER_LOGS',
      queryFn: () => ListClusterLogStreams(clusterName),
    },
  ])

  const isLoading = describeClusterQuery.isLoading || logStreamsQuery.isLoading
  const logStreams = logStreamsQuery.data || []

  const logStreamsToDisplay = logStreams.map(logStream =>
    withNodeType(headNode, logStream),
  )

  const propertyFilterI18n = usePropertyFilterI18nStrings({
    filteringPlaceholder: t(
      'clusterLogs.logStreams.filtering.filteringPlaceholder',
    ),
  })

  const columnDefinitions: TableProps.ColumnDefinition<LogStreamView>[] =
    useMemo(
      () => [
        {
          id: 'hostname',
          header: t('clusterLogs.logStreams.columns.hostname'),
          cell: item => item.hostname,
          sortingField: 'hostname',
        },
        {
          id: 'nodeType',
          header: t('clusterLogs.logStreams.columns.nodeType'),
          cell: item => {
            if (!item.nodeType) {
              return t('clusterLogs.logStreams.nodeType.empty')
            }

            if (item.nodeType === NodeType.HeadNode) {
              return t('clusterLogs.logStreams.nodeType.headNode')
            } else {
              return t('clusterLogs.logStreams.nodeType.computeNode')
            }
          },
          sortingField: 'nodeType',
        },
        {
          id: 'logIdentifier',
          header: t('clusterLogs.logStreams.columns.logIdentifier'),
          cell: item => item.logIdentifier,
          sortingField: 'logIdentifier',
        },
        {
          id: 'lastEventTimestamp',
          header: t('clusterLogs.logStreams.columns.timestamp'),
          cell: item => <DateView date={item.lastEventTimestamp} />,
          sortingField: 'lastEventTimestamp',
        },
      ],
      [t],
    )

  const {
    items,
    filteredItemsCount,
    collectionProps,
    propertyFilterProps,
    paginationProps,
  } = useCollection(
    logStreamsToDisplay,
    extendCollectionsOptions({
      propertyFiltering: {
        filteringProperties: [
          {
            key: 'hostname',
            operators: ['=', '!=', ':', '!:'],
            propertyLabel: t('clusterLogs.logStreams.columns.hostname'),
            groupValuesLabel: t('clusterLogs.logStreams.columns.hostname'),
          },
          {
            key: 'nodeType',
            operators: ['=', '!=', ':', '!:'],
            propertyLabel: t('clusterLogs.logStreams.columns.nodeType'),
            groupValuesLabel: t('clusterLogs.logStreams.columns.nodeType'),
          },
          {
            key: 'logIdentifier',
            operators: ['=', '!=', ':', '!:'],
            propertyLabel: t('clusterLogs.logStreams.columns.logIdentifier'),
            groupValuesLabel: t('clusterLogs.logStreams.columns.logIdentifier'),
          },
          {
            key: 'lastEventTimestamp',
            operators: ['=', '!=', ':', '!:', '>', '<', '<=', '>='],
            propertyLabel: t('clusterLogs.logStreams.columns.timestamp'),
            groupValuesLabel: t('clusterLogs.logStreams.columns.timestamp'),
          },
        ],
        empty: (
          <EmptyState
            title={t('clusterLogs.logStreams.filtering.empty.title')}
            subtitle={t('clusterLogs.logStreams.filtering.empty.subtitle')}
          />
          /**
           * This value is arbitrary and it has been chosen
           * with goal of allowing the table below to be
           * seen without too much scrolling.
           *
           */
        ),
        noMatch: (
          <EmptyState
            title={t('clusterLogs.logStreams.filtering.noMatch.title')}
            subtitle={t('clusterLogs.logStreams.filtering.noMatch.subtitle')}
          />
        ),
      },
      pagination: {
        pageSize: 5,
      },
      sorting: {},
      selection: {},
    }),
  )

  const onSelectionChange: NonCancelableEventHandler<
    TableProps.SelectionChangeDetail<LogStreamView>
  > = useCallback(
    ({detail}) => {
      if (!detail.selectedItems) return

      setSelectedItems(detail.selectedItems)
      onLogStreamSelect(detail.selectedItems[0].logStreamName)
    },
    [onLogStreamSelect],
  )

  return (
    <Table
      {...collectionProps}
      loading={isLoading}
      loadingText={t('clusterLogs.logStreams.loadingText')}
      columnDefinitions={columnDefinitions}
      items={items}
      trackBy="lastEventTimestamp"
      selectionType="single"
      selectedItems={selectedItems}
      onSelectionChange={onSelectionChange}
      header={
        <Header counter={`(${items.length})`}>
          {t('clusterLogs.logStreams.title')}
        </Header>
      }
      pagination={<Pagination {...paginationProps} />}
      filter={
        <PropertyFilter
          {...propertyFilterProps}
          countText={t('clusterLogs.logStreams.filtering.countText', {
            filteredItemsCount,
          })}
          i18nStrings={propertyFilterI18n}
        />
      }
    />
  )
}
