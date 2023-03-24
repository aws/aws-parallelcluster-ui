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
  BreadcrumbGroup,
  BreadcrumbGroupProps,
  ContentLayout,
  Header,
  SpaceBetween,
} from '@cloudscape-design/components'
import React, {useCallback} from 'react'
import {useMemo} from 'react'
import {Trans, useTranslation} from 'react-i18next'
import {useParams} from 'react-router-dom'
import {useHelpPanel} from '../../components/help-panel/HelpPanel'
import TitleDescriptionHelpPanel from '../../components/help-panel/TitleDescriptionHelpPanel'
import InfoLink from '../../components/InfoLink'
import Layout from '../Layout'
import {LogMessagesTable} from './LogMessagesTable'
import {LogStreamsTable} from './LogStreamsTable'

function LogsHelpPanel({clusterName}: {clusterName: string}) {
  const {t} = useTranslation()

  const footerLinks = useMemo(
    () => [
      {
        title: t('clusterLogs.helpPanel.cwIntegrationLink.title'),
        href: t('clusterLogs.helpPanel.cwIntegrationLink.href'),
      },
      {
        title: t('clusterLogs.helpPanel.cwDashboardLink.title'),
        href: t('clusterLogs.helpPanel.cwDashboardLink.href'),
      },
      {
        title: t('clusterLogs.helpPanel.monitoringLink.title'),
        href: t('clusterLogs.helpPanel.monitoringLink.href'),
      },
    ],
    [t],
  )

  return (
    <TitleDescriptionHelpPanel
      title={t('clusterLogs.helpPanel.title', {clusterName})}
      description={<Trans i18nKey="clusterLogs.helpPanel.description" />}
      footerLinks={footerLinks}
    />
  )
}

export function Logs() {
  const {t} = useTranslation()
  const {clusterName} = useParams()
  const [selectedLogStream, setSelectedLogStream] = React.useState<
    string | undefined
  >()

  useHelpPanel(<LogsHelpPanel clusterName={clusterName!} />)

  const breadcrumbItems: BreadcrumbGroupProps.Item[] = useMemo(
    () => [
      {text: t('global.menu.header'), href: '/'},
      {text: t('global.menu.clusters'), href: '/clusters'},
      {text: clusterName!, href: `/clusters/${clusterName}`},
      {text: t('clusterLogs.breadcrumbLabel'), href: '#'},
    ],
    [clusterName, t],
  )

  const onLogStreamSelect = useCallback((selectedLogStream: string) => {
    setSelectedLogStream(selectedLogStream)
  }, [])

  return (
    <Layout breadcrumbs={<BreadcrumbGroup items={breadcrumbItems} />}>
      <ContentLayout
        header={
          <Header
            variant="h1"
            info={
              <InfoLink
                helpPanel={<LogsHelpPanel clusterName={clusterName!} />}
              />
            }
          >
            {t('clusterLogs.title', {clusterName})}
          </Header>
        }
      >
        <SpaceBetween size="xl">
          <LogStreamsTable
            clusterName={clusterName!}
            onLogStreamSelect={onLogStreamSelect}
          />
          <LogMessagesTable
            clusterName={clusterName!}
            logStreamName={selectedLogStream}
          />
        </SpaceBetween>
      </ContentLayout>
    </Layout>
  )
}
