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
  ButtonDropdown,
  ButtonDropdownProps,
} from '@cloudscape-design/components'
import {CancelableEventHandler} from '@cloudscape-design/components/internal/events'
import React, {useCallback, useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {NavigateFunction, useNavigate} from 'react-router-dom'
import {GetConfiguration} from '../../../model'
import {setState} from '../../../store'
import loadTemplate from '../../Configure/util'
import {HiddenFileUpload} from '../../../components/HiddenFileUpload'
// @ts-expect-error TS(7016) FIXME: Could not find a declaration file for module 'js-y... Remove this comment to see the full error message
import jsyaml from 'js-yaml'
import {FromClusterModal} from '../FromClusterModal/FromClusterModal'

const loadingPath = ['app', 'wizard', 'source', 'loading']

function copyFrom(sourceClusterName: any) {
  setState(loadingPath, true)
  GetConfiguration(sourceClusterName, (configuration: any) => {
    loadTemplate(jsyaml.load(configuration), () => setState(loadingPath, false))
  })
}

interface Props {
  openWizard: (navigate: NavigateFunction) => void
}

export const CreateButtonDropdown: React.FC<Props> = ({openWizard}) => {
  const {t} = useTranslation()
  const [isFileDialogOpen, setIsFileDialogOpen] = React.useState(false)
  const [isModalVisible, setIsModalVisible] = React.useState(false)

  const navigate = useNavigate()

  const onModalDismiss = useCallback(() => {
    setIsModalVisible(false)
  }, [])

  const onCreate = useCallback(
    (name: string) => {
      copyFrom(name)
      openWizard(navigate)
    },
    [navigate, openWizard],
  )

  const onFileSelectorDismiss = useCallback(() => {
    setIsFileDialogOpen(false)
  }, [])

  const onFileChange = useCallback(
    (data: string) => {
      setIsFileDialogOpen(false)
      setState(loadingPath, true)
      loadTemplate(jsyaml.load(data), () => setState(loadingPath, false))
      openWizard(navigate)
    },
    [navigate, openWizard],
  )

  const onCreateClick: CancelableEventHandler<ButtonDropdownProps.ItemClickDetails> =
    React.useCallback(
      ({detail}) => {
        switch (detail.id) {
          case 'wizard':
            openWizard(navigate)
            return
          case 'template':
            setIsFileDialogOpen(true)
            return
          case 'from-cluster':
            setIsModalVisible(true)
            return
        }
      },
      [navigate, openWizard],
    )

  const createDropdownItems: ButtonDropdownProps.Item[] = useMemo(
    () => [
      {
        id: 'wizard',
        text: t('cluster.list.actions.createFromWizard'),
      },
      {
        id: 'template',
        text: t('cluster.list.actions.createFromTemplate'),
      },
      {
        id: 'from-cluster',
        text: t('cluster.list.actions.createFromCluster'),
      },
    ],
    [t],
  )

  return (
    <>
      <ButtonDropdown
        variant="primary"
        items={createDropdownItems}
        onItemClick={onCreateClick}
      >
        {t('cluster.list.actions.create')}
      </ButtonDropdown>
      <HiddenFileUpload
        open={isFileDialogOpen}
        onDismiss={onFileSelectorDismiss}
        onChange={onFileChange}
      />
      <FromClusterModal
        visible={isModalVisible}
        onDismiss={onModalDismiss}
        onCreate={onCreate}
      />
    </>
  )
}
