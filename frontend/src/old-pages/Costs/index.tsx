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
} from '@cloudscape-design/components'
import {useMemo} from 'react'
import {Trans, useTranslation} from 'react-i18next'
import {useParams} from 'react-router-dom'
import InfoLink from '../../components/InfoLink'
import {useHelpPanel} from '../../components/help-panel/HelpPanel'
import TitleDescriptionHelpPanel from '../../components/help-panel/TitleDescriptionHelpPanel'
import Layout from '../Layout'
import {CostData} from './CostData'

function CostMonitoringHelpPanel({clusterName}: {clusterName: string}) {
  const {t} = useTranslation()

  return (
    <TitleDescriptionHelpPanel
      title={t('costMonitoring.helpPanel.title', {clusterName})}
      description={<Trans i18nKey="costMonitoring.helpPanel.description" />}
    />
  )
}

export function Costs() {
  const {t} = useTranslation()
  const {clusterName} = useParams()

  useHelpPanel(<CostMonitoringHelpPanel clusterName={clusterName!} />)

  const breadcrumbItems: BreadcrumbGroupProps.Item[] = useMemo(
    () => [
      {text: t('global.menu.header'), href: '/'},
      {text: t('global.menu.clusters'), href: '/clusters'},
      {text: clusterName!, href: `/clusters/${clusterName}`},
      {text: t('costMonitoring.breadcrumbLabel'), href: '#'},
    ],
    [clusterName, t],
  )

  return (
    <Layout breadcrumbs={<BreadcrumbGroup items={breadcrumbItems} />}>
      <ContentLayout
        header={
          <Header
            variant="h1"
            info={
              <InfoLink
                helpPanel={
                  <CostMonitoringHelpPanel clusterName={clusterName!} />
                }
              />
            }
          >
            {t('costMonitoring.title', {clusterName})}
          </Header>
        }
      >
        <CostData clusterName={clusterName!} />
      </ContentLayout>
    </Layout>
  )
}
