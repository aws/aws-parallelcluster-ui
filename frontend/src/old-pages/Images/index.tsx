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
  NonCancelableCustomEvent,
  Tabs,
  TabsProps,
} from '@cloudscape-design/components'
import {useCallback, useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import CustomImages from './CustomImages/CustomImages'
import Layout from '../Layout'
import OfficialImages from './OfficialImages/OfficialImages'
import React from 'react'
import {ImagesSplitPanel} from './ImagesSplitPanel'

const imagesSlug = 'images'

export function Images() {
  const {t} = useTranslation()
  const [activeTabId, setActiveTabId] = React.useState('official-images')

  const shouldHideSplitPanel = activeTabId !== 'custom-images'

  const imagesTabs: TabsProps.Tab[] = useMemo(
    () => [
      {
        id: 'official-images',
        label: t('images.tabs.officialImages'),
        content: <OfficialImages />,
      },
      {
        id: 'custom-images',
        label: t('images.tabs.customImages'),
        content: <CustomImages />,
      },
    ],
    [t],
  )

  const onTabChange = useCallback(
    (event: NonCancelableCustomEvent<TabsProps.ChangeDetail>) => {
      const {
        detail: {activeTabId},
      } = event

      setActiveTabId(activeTabId)
    },
    [],
  )

  return (
    <Layout
      pageSlug={imagesSlug}
      splitPanel={<ImagesSplitPanel hideSplitPanel={shouldHideSplitPanel} />}
    >
      <Tabs tabs={imagesTabs} onChange={onTabChange} />
    </Layout>
  )
}
