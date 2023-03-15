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
import {useTranslation} from 'react-i18next'
import {useParams} from 'react-router-dom'
import Layout from '../Layout'

export function Logs() {
  const {t} = useTranslation()
  const {clusterName} = useParams()

  const breadcrumbItems: BreadcrumbGroupProps.Item[] = useMemo(
    () => [
      {text: t('global.menu.clusters'), href: '/clusters'},
      {text: clusterName!, href: `/clusters/${clusterName}`},
      {text: t('clusterLogs.breadcrumbLabel'), href: '#'},
    ],
    [clusterName, t],
  )

  return (
    <Layout breadcrumbs={<BreadcrumbGroup items={breadcrumbItems} />}>
      <ContentLayout
        header={
          <Header variant="awsui-h1-sticky">
            {t('clusterLogs.title', {clusterName})}
          </Header>
        }
      ></ContentLayout>
    </Layout>
  )
}
