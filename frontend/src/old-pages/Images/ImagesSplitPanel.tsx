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

import {SplitPanel} from '@cloudscape-design/components'
import {useTranslation} from 'react-i18next'
import {useState} from '../../store'
import CustomImageDetails from './CustomImages/CustomImageDetails'
import React from 'react'

interface Props {
  hideSplitPanel: boolean
}
export const ImagesSplitPanel: React.FC<Props> = ({hideSplitPanel}) => {
  const {t} = useTranslation()
  const imageId = useState(['app', 'customImages', 'selected'])

  if (hideSplitPanel) return null

  return (
    <SplitPanel
      i18nStrings={{
        preferencesTitle: t('global.splitPanel.preferencesTitle'),
        preferencesPositionLabel: t(
          'global.splitPanel.preferencesPositionLabel',
        ),
        preferencesPositionDescription: t(
          'global.splitPanel.preferencesPositionDescription',
        ),
        preferencesPositionSide: t('global.splitPanel.preferencesPositionSide'),
        preferencesPositionBottom: t(
          'global.splitPanel.preferencesPositionBottom',
        ),
        preferencesConfirm: t('global.splitPanel.preferencesConfirm'),
        preferencesCancel: t('global.splitPanel.preferencesCancel'),
        closeButtonAriaLabel: t('global.splitPanel.closeButtonAriaLabel'),
        openButtonAriaLabel: t('global.splitPanel.openButtonAriaLabel'),
        resizeHandleAriaLabel: t('global.splitPanel.resizeHandleAriaLabel'),
      }}
      header={
        imageId
          ? t('customImages.splitPanel.imageSelectedText', {imageId})
          : t('customImages.splitPanel.noImageSelectedText')
      }
    >
      {imageId ? (
        <CustomImageDetails />
      ) : (
        <div>
          <h3 style={{userSelect: 'none'}}>
            {t('customImages.splitPanel.selectImageText')}
          </h3>
        </div>
      )}
    </SplitPanel>
  )
}
