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
import * as React from 'react'
import {Trans, useTranslation} from 'react-i18next'
import {CreateCluster, UpdateCluster, ListClusters, notify} from '../../model'

// UI Elements
import {
  Container,
  Header,
  Checkbox,
  SpaceBetween,
  Flashbar,
  FlashbarProps,
} from '@cloudscape-design/components'

// Components
import ConfigView from '../../components/ConfigView'

// State
import {setState, getState, useState, updateState} from '../../store'
import {NavigateFunction} from 'react-router-dom'
import TitleDescriptionHelpPanel from '../../components/help-panel/TitleDescriptionHelpPanel'
import {useHelpPanel} from '../../components/help-panel/HelpPanel'
import {errorsToFlashbarItems} from './errorsToFlashbarItems'

// Constants
const configPath = ['app', 'wizard', 'clusterConfigYaml']
const clusterLoadingMsgId = 'cluster-loading'

function handleWarnings(resp: any) {
  if (!resp.validationMessages) return

  resp.validationMessages.forEach((message: any) => {
    notify(message.message, 'warning')
  })
}

function setClusterLoadingMsg(
  clusterName: string,
  editing: boolean,
  dryRun: boolean,
) {
  let content: React.ReactElement
  if (dryRun) {
    content = (
      <Trans
        i18nKey={'wizard.dryRun.pending'}
        values={{clusterName: clusterName}}
      />
    )
  } else {
    content = editing ? (
      <Trans
        i18nKey={'wizard.update.pending'}
        values={{clusterName: clusterName}}
      />
    ) : (
      <Trans
        i18nKey={'wizard.create.pending'}
        values={{clusterName: clusterName}}
      />
    )
  }
  notify(content, 'success', clusterLoadingMsgId, true, true)
}

function removeClusterLoadingMsg() {
  updateState(
    ['app', 'messages'],
    (currentMessages: Array<FlashbarProps.MessageDefinition>) =>
      (currentMessages || []).filter(
        message => message.id !== clusterLoadingMsgId,
      ),
  )
}

function handleCreate(
  clearWizardState: () => void,
  navigate: NavigateFunction,
) {
  const clusterName = getState(['app', 'wizard', 'clusterName'])
  const editing = getState(['app', 'wizard', 'editing'])
  const forceUpdate = getState(['app', 'wizard', 'forceUpdate'])
  const clusterConfig = getState(configPath) || ''
  const dryRun = false
  const region = getState(['app', 'wizard', 'config', 'Region'])
  const selectedRegion = getState(['app', 'selectedRegion'])
  setClusterLoadingMsg(clusterName, editing, dryRun)

  var errHandler = (err: any) => {
    setState(['app', 'wizard', 'errors', 'create'], err)
    removeClusterLoadingMsg()
  }
  var successHandler = (resp: any) => {
    let href = `/clusters/${clusterName}/stack-events`
    handleWarnings(resp)
    setState(['app', 'selectedRegion'], region)
    setState(['app', 'clusters', 'selected'], clusterName)

    ListClusters()
    clearWizardState()
    notify(
      <Trans
        i18nKey={'wizard.create.success'}
        values={{clusterName: clusterName}}
      />,
      'success',
    )
    navigate(href)
  }
  setState(['app', 'wizard', 'errors', 'create'], null)

  if (editing) {
    UpdateCluster(
      clusterName,
      clusterConfig,
      dryRun,
      forceUpdate,
      successHandler,
      errHandler,
    )
  } else {
    CreateCluster(
      clusterName,
      clusterConfig,
      region,
      selectedRegion,
      dryRun,
      successHandler,
      errHandler,
    )
  }
}

function handleDryRun() {
  const clusterName = getState(['app', 'wizard', 'clusterName'])
  const editing = getState(['app', 'wizard', 'editing'])
  const forceUpdate = getState(['app', 'wizard', 'forceUpdate'])
  const clusterConfig = getState(configPath) || ''
  const region = getState(['app', 'wizard', 'config', 'Region'])
  const selectedRegion = getState(['app', 'selectedRegion'])
  const dryRun = true
  setClusterLoadingMsg(clusterName, editing, dryRun)

  var errHandler = (err: any) => {
    setState(['app', 'wizard', 'errors', 'create'], err)
    removeClusterLoadingMsg()
  }
  var successHandler = (resp: any) => {
    handleWarnings(resp)
  }
  setState(['app', 'wizard', 'errors', 'create'], null)
  if (editing)
    UpdateCluster(
      clusterName,
      clusterConfig,
      dryRun,
      forceUpdate,
      successHandler,
      errHandler,
    )
  else
    CreateCluster(
      clusterName,
      clusterConfig,
      region,
      selectedRegion,
      dryRun,
      successHandler,
      errHandler,
    )
}

function createValidate() {
  return true
}

const CreateReviewHelpPanel = () => {
  const {t} = useTranslation()
  const footerLinks = React.useMemo(
    () => [
      {
        title: t('wizard.create.helpPanel.link.title'),
        href: t('wizard.create.helpPanel.link.href'),
      },
    ],
    [t],
  )
  return (
    <TitleDescriptionHelpPanel
      title={t('wizard.create.helpPanel.title')}
      description={<Trans i18nKey="wizard.create.helpPanel.description" />}
      footerLinks={footerLinks}
    />
  )
}

const EditReviewHelpPanel = () => {
  const {t} = useTranslation()
  const footerLinks = React.useMemo(
    () => [
      {
        title: t('wizard.update.helpPanel.link.title'),
        href: t('wizard.update.helpPanel.link.href'),
      },
    ],
    [t],
  )
  return (
    <TitleDescriptionHelpPanel
      title={t('wizard.update.helpPanel.title')}
      description={<Trans i18nKey="wizard.update.helpPanel.description" />}
      footerLinks={footerLinks}
    />
  )
}

function Create() {
  const {t} = useTranslation()
  const clusterConfig = useState(configPath)
  const forceUpdate = useState(['app', 'wizard', 'forceUpdate']) || false
  const errors = useState(['app', 'wizard', 'errors', 'create'])
  const editing = getState(['app', 'wizard', 'editing'])

  const HelpPanelComponent = editing
    ? EditReviewHelpPanel
    : CreateReviewHelpPanel

  useHelpPanel(<HelpPanelComponent />)

  React.useEffect(() => {
    setFlashbarItems(errorsToFlashbarItems(errors, setFlashbarItems))
  }, [errors])

  const [flashbarItems, setFlashbarItems] = React.useState<
    FlashbarProps.MessageDefinition[]
  >([])

  const flashbarProps: FlashbarProps = {
    stackItems: true,
    items: flashbarItems,
  }

  return (
    <Container
      header={
        <Header description={t('wizard.create.configuration.description')}>
          {t('wizard.create.configuration.title')}
        </Header>
      }
    >
      <SpaceBetween direction="vertical" size="s">
        {flashbarProps.items.length > 0 ? (
          <Flashbar {...flashbarProps} />
        ) : null}
        <ConfigView
          config={clusterConfig}
          pending={!clusterConfig}
          onChange={({detail}: any) => {
            setState(configPath, detail.value)
          }}
        />
        {editing && (
          <Checkbox
            checked={forceUpdate}
            onChange={() =>
              setState(['app', 'wizard', 'forceUpdate'], !forceUpdate)
            }
          >
            {t('wizard.create.configuration.forceUpdate')}
          </Checkbox>
        )}
      </SpaceBetween>
    </Container>
  )
}

export {
  Create,
  EditReviewHelpPanel,
  CreateReviewHelpPanel,
  createValidate,
  handleCreate,
  handleDryRun,
}
