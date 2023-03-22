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
import {
  CreateCluster,
  UpdateCluster,
  ListClusters,
  DescribeCluster,
  notify,
} from '../../model'

// UI Elements
import {
  Container,
  Header,
  Checkbox,
  Spinner,
  SpaceBetween,
  Flashbar,
  FlashbarProps,
} from '@cloudscape-design/components'

// Components
import ConfigView from '../../components/ConfigView'

// State
import {setState, getState, useState} from '../../store'
import {NavigateFunction} from 'react-router-dom'
import TitleDescriptionHelpPanel from '../../components/help-panel/TitleDescriptionHelpPanel'
import {useHelpPanel} from '../../components/help-panel/HelpPanel'
import {ConfigError, CreateErrors, UpdateError} from './Create.types'
import {capitalize} from 'lodash'
import {StackedFlashbarProps} from '@cloudscape-design/components/flashbar/interfaces'
import i18next from 'i18next'

// Constants
const configPath = ['app', 'wizard', 'clusterConfigYaml']
const priority: FlashbarProps.Type[] = ['error', 'success', 'warning', 'info']

function handleWarnings(resp: any) {
  if (!resp.validationMessages) return

  resp.validationMessages.forEach((message: any) => {
    notify(message.message, 'warning')
  })
}

function handleCreate(
  clearWizardState: () => void,
  navigate: NavigateFunction,
) {
  const clusterName = getState(['app', 'wizard', 'clusterName'])
  const editing = getState(['app', 'wizard', 'editing'])
  const disableRollback =
    getState(['app', 'wizard', 'disableRollback']) || false
  const forceUpdate = getState(['app', 'wizard', 'forceUpdate'])
  const clusterConfig = getState(configPath) || ''
  const dryRun = false
  const region = getState(['app', 'wizard', 'config', 'Region'])
  const selectedRegion = getState(['app', 'selectedRegion'])
  var errHandler = (err: any) => {
    setState(['app', 'wizard', 'errors', 'create'], err)
    setState(['app', 'wizard', 'pending'], false)
  }
  var successHandler = (resp: any) => {
    let href = `/clusters/${clusterName}/stack-events`
    handleWarnings(resp)

    setState(['app', 'wizard', 'pending'], false)
    DescribeCluster(clusterName)
    setState(['app', 'clusters', 'selected'], clusterName)
    ListClusters()
    clearWizardState()
    navigate(href)
  }
  setState(['app', 'wizard', 'errors', 'create'], null)

  if (editing) {
    setState(['app', 'wizard', 'pending'], 'Update')
    UpdateCluster(
      clusterName,
      clusterConfig,
      dryRun,
      forceUpdate,
      successHandler,
      errHandler,
    )
  } else {
    setState(['app', 'wizard', 'pending'], 'Create')
    CreateCluster(
      clusterName,
      clusterConfig,
      region,
      selectedRegion,
      disableRollback,
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
  const disableRollback = false
  const dryRun = true
  var errHandler = (err: any) => {
    setState(['app', 'wizard', 'errors', 'create'], err)
    setState(['app', 'wizard', 'pending'], false)
  }
  var successHandler = (resp: any) => {
    handleWarnings(resp)
    setState(['app', 'wizard', 'pending'], false)
  }
  setState(['app', 'wizard', 'pending'], 'Dry Run')
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
      disableRollback,
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

function dismissableMessage(
  messageDefinition: FlashbarProps.MessageDefinition,
  setFlashbarItems: React.Dispatch<
    React.SetStateAction<FlashbarProps.MessageDefinition[]>
  >,
): FlashbarProps.MessageDefinition {
  return {
    ...messageDefinition,
    dismissible: true,
    onDismiss: () =>
      setFlashbarItems(items =>
        items.filter(item => item.id !== messageDefinition.id),
      ),
  }
}

function compareFlashbarItems(
  itemA: FlashbarProps.MessageDefinition,
  itemB: FlashbarProps.MessageDefinition,
): number {
  const itemAPriority = priority.indexOf(itemA.type!)
  const itemBPriority = priority.indexOf(itemB.type!)

  if (itemAPriority > itemBPriority) return 1
  if (itemAPriority < itemBPriority) return -1
  else return 0
}

export function errorsToFlashbarItems(
  errors: CreateErrors,
  setFlashbarItems: React.Dispatch<
    React.SetStateAction<FlashbarProps.MessageDefinition[]>
  >,
) {
  let items: FlashbarProps.MessageDefinition[] = []

  if (!errors) return items

  const success = errors.message && errors.message.includes('succeeded')
  const configErrors =
    errors.configurationValidationErrors || errors.validationMessages
  const updateErrors = errors.updateValidationErrors

  if (success) {
    items.push(
      dismissableMessage(
        {
          type: 'success',
          header: i18next.t('wizard.create.flashBar.success'),
          content: errors.message,
          id: 'success',
        },
        setFlashbarItems,
      ),
    )
  }

  configErrors?.forEach((error: ConfigError, index: number) => {
    items.push(
      dismissableMessage(
        {
          type: error.level.toLowerCase() as FlashbarProps.Type,
          header: capitalize(error.level.toLowerCase()),
          content: `${error.type}: ${error.message}`,
          id: `config-err-${index}`,
        },
        setFlashbarItems,
      ),
    )
  })

  updateErrors?.forEach((error: UpdateError, index: number) => {
    items.push(
      dismissableMessage(
        {
          type: error.level.toLowerCase() as FlashbarProps.Type,
          header: capitalize(error.level.toLowerCase()),
          content: error.message,
          id: `update-err-${index}`,
        },
        setFlashbarItems,
      ),
    )
  })

  items.sort(compareFlashbarItems)
  return items
}

function Create() {
  const {t} = useTranslation()
  const clusterConfig = useState(configPath)
  const forceUpdate = useState(['app', 'wizard', 'forceUpdate']) || false
  const disableRollback =
    useState(['app', 'wizard', 'disableRollback']) || false
  const errors = useState(['app', 'wizard', 'errors', 'create'])
  const pending = useState(['app', 'wizard', 'pending'])
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

  const flashbarProps: StackedFlashbarProps = {
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
        <Flashbar {...flashbarProps} />
        <ConfigView
          config={clusterConfig}
          pending={!clusterConfig}
          onChange={({detail}: any) => {
            setState(configPath, detail.value)
          }}
        />
        {pending && (
          <div>
            <Spinner size="normal" />{' '}
            {t('wizard.create.configuration.pending', {action: pending})}
          </div>
        )}
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
        {!editing && (
          <Checkbox
            checked={disableRollback}
            onChange={() =>
              setState(['app', 'wizard', 'disableRollback'], !disableRollback)
            }
          >
            {t('wizard.create.configuration.disableRollback')}
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
