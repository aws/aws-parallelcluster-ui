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

// Frameworks
import * as React from 'react'
import i18next from 'i18next'
import {Trans, useTranslation} from 'react-i18next'
import {useSelector} from 'react-redux'
import {findFirst, getIn} from '../../util'
import safeGet from 'lodash/get'

// UI Elements
import {
  Alert,
  Box,
  Checkbox,
  ColumnLayout,
  Container,
  ExpandableSection,
  FormField,
  Header,
  Input,
  Select,
  SpaceBetween,
} from '@cloudscape-design/components'

// State
import {
  setState,
  getState,
  useState,
  clearState,
  updateState,
  ssmPolicy,
} from '../../store'

// Components
import {
  HeadNodeActionsEditor,
  InstanceSelect,
  RootVolume,
  SecurityGroups,
  SubnetSelect,
  IamPoliciesEditor,
  ActionsEditor,
  CheckboxWithHelpPanel,
} from './Components'
import {useFeatureFlag} from '../../feature-flags/useFeatureFlag'
import InfoLink from '../../components/InfoLink'
import TitleDescriptionHelpPanel from '../../components/help-panel/TitleDescriptionHelpPanel'
import {useHelpPanel} from '../../components/help-panel/HelpPanel'

// Constants
const headNodePath = ['app', 'wizard', 'config', 'HeadNode']
const errorsPath = ['app', 'wizard', 'errors', 'headNode']
const keypairPath = [...headNodePath, 'Ssh', 'KeyName']
const imdsSecuredPath = [...headNodePath, 'Imds', 'Secured']

function headNodeValidate() {
  const subnetPath = [...headNodePath, 'Networking', 'SubnetId']
  const subnetValue = getState(subnetPath)

  const rootVolumeSizePath = [
    ...headNodePath,
    'LocalStorage',
    'RootVolume',
    'Size',
  ]
  const rootVolumeValue = getState(rootVolumeSizePath)

  const instanceTypePath = [...headNodePath, 'InstanceType']
  const instanceTypeValue = getState(instanceTypePath)

  const actionsPath = [...headNodePath, 'CustomActions']

  const onStartPath = [...actionsPath, 'OnNodeStart']
  const onStart = getState(onStartPath)

  const onConfiguredPath = [...actionsPath, 'OnNodeConfigured']
  const onConfigured = getState(onConfiguredPath)

  const onUpdatedPath = [...actionsPath, 'OnNodeUpdated']
  const onUpdated = getState(onUpdatedPath)

  let valid = true

  if (!subnetValue) {
    setState(
      [...errorsPath, 'subnet'],
      i18next.t('wizard.headNode.validation.selectSubnet'),
    )
    valid = false
  } else {
    clearState([...errorsPath, 'subnet'])
  }

  if (!instanceTypeValue) {
    setState(
      [...errorsPath, 'instanceType'],
      i18next.t('wizard.headNode.validation.selectInstanceType'),
    )
    valid = false
  } else {
    clearState([...errorsPath, 'instanceType'])
  }

  if (rootVolumeValue === '') {
    setState(
      [...errorsPath, 'rootVolume'],
      i18next.t('wizard.headNode.validation.setRootVolumeSize'),
    )
    valid = false
  } else if (
    rootVolumeValue &&
    (!Number.isInteger(rootVolumeValue) || rootVolumeValue < 35)
  ) {
    setState(
      [...errorsPath, 'rootVolume'],
      i18next.t('wizard.headNode.validation.rootVolumeMinimum'),
    )
    valid = false
  } else {
    clearState([...errorsPath, 'rootVolume'])
  }

  if (
    onStart &&
    getState([...onStartPath, 'Args']) &&
    !getState([...onStartPath, 'Script'])
  ) {
    setState(
      [...errorsPath, 'onStart'],
      i18next.t('wizard.headNode.validation.scriptWithArgs'),
    )
    valid = false
  } else {
    clearState([...errorsPath, 'onStart'])
  }

  if (
    onConfigured &&
    getState([...onConfiguredPath, 'Args']) &&
    !getState([...onConfiguredPath, 'Script'])
  ) {
    setState(
      [...errorsPath, 'onConfigured'],
      i18next.t('wizard.headNode.validation.scriptWithArgs'),
    )
    valid = false
  } else {
    clearState([...errorsPath, 'onConfigured'])
  }

  if (
    onUpdated &&
    getState([...onUpdatedPath, 'Args']) &&
    !getState([...onUpdatedPath, 'Script'])
  ) {
    setState(
      [...errorsPath, 'onUpdated'],
      i18next.t('wizard.headNode.validation.scriptWithArgs'),
    )
    valid = false
  } else {
    clearState([...errorsPath, 'onUpdated'])
  }

  setState([...errorsPath, 'validated'], true)

  return valid
}

function enableSsm(enable: any) {
  const iamPolicies = getState([
    ...headNodePath,
    'Iam',
    'AdditionalIamPolicies',
  ])
  const defaultRegion = getState(['aws', 'region'])
  const region = getState(['app', 'selectedRegion']) || defaultRegion

  if (enable) {
    if (iamPolicies && findFirst(iamPolicies, isSsmPolicy)) return
    updateState(
      [...headNodePath, 'Iam', 'AdditionalIamPolicies'],
      (existing: any) => {
        return [...(existing || []), {Policy: ssmPolicy(region)}]
      },
    )
  } else {
    if (!iamPolicies || (iamPolicies && !findFirst(iamPolicies, isSsmPolicy)))
      return
    if (iamPolicies.length === 1) clearState([...headNodePath, 'Iam'])
    else {
      updateState(
        [...headNodePath, 'Iam', 'AdditionalIamPolicies'],
        (existing: any) =>
          existing.filter((p: any) => {
            return !isSsmPolicy(p)
          }),
      )
    }
  }
}
const setKeyPair = (kpValue?: string) => {
  if (kpValue) setState(keypairPath, kpValue)
  else {
    clearState([...headNodePath, 'Ssh'])
    enableSsm(true)
  }
}

function KeypairSelect() {
  const {t} = useTranslation()
  const keypairsInAWSConfig = useState(['aws', 'keypairs'])
  const selectedKeypairName = useState(keypairPath)
  const editing = useState(['app', 'wizard', 'editing'])
  const keypairToOption = (kp: any) => {
    if (kp === 'None' || kp === null || kp === undefined)
      return {label: 'None', value: null}
    else return {label: kp.KeyName, value: kp.KeyName}
  }

  const keypairsWithNone = ['None', ...keypairsInAWSConfig]

  React.useEffect(() => {
    const firstAvailableKeypair = safeGet(keypairsInAWSConfig, ['0', 'KeyName'])
    if (!selectedKeypairName && firstAvailableKeypair) {
      setKeyPair(firstAvailableKeypair)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keypairsInAWSConfig])

  return (
    <FormField
      label={t('wizard.headNode.keypair.label')}
      description={t('wizard.headNode.keypair.description')}
    >
      <Select
        disabled={editing}
        selectedOption={keypairToOption(
          findFirst(keypairsInAWSConfig, (x: any) => {
            return x.KeyName === selectedKeypairName
          }),
        )}
        onChange={({detail}) => {
          setKeyPair(detail.selectedOption.value)
        }}
        selectedAriaLabel="Selected"
        options={keypairsWithNone.map(keypairToOption)}
      />
    </FormField>
  )
}

function isSsmPolicy(p: any) {
  const region =
    getState(['app', 'selectedRegion']) || getState(['aws', 'region'])
  return p.hasOwnProperty('Policy') && p.Policy === ssmPolicy(region)
}

function SsmSettings() {
  const {t} = useTranslation()
  const dcvEnabled = useState([...headNodePath, 'Dcv', 'Enabled']) || false

  const ssmEnabled = useSelector(state => {
    const iamPolicies = getIn(state, [
      ...headNodePath,
      'Iam',
      'AdditionalIamPolicies',
    ])
    return findFirst(iamPolicies, isSsmPolicy) || false
  })

  const ssmOnChange = React.useCallback(
    ({detail}) => enableSsm(!ssmEnabled),
    [ssmEnabled],
  )

  return (
    <CheckboxWithHelpPanel
      checked={ssmEnabled}
      onChange={ssmOnChange}
      disabled={dcvEnabled}
      helpPanel={
        <TitleDescriptionHelpPanel
          title={t('wizard.headNode.Ssm.title')}
          description={<Trans i18nKey="wizard.headNode.Ssm.help" />}
        />
      }
    >
      <Trans i18nKey="wizard.headNode.Ssm.label" />
    </CheckboxWithHelpPanel>
  )
}

function DcvSettings() {
  const {t} = useTranslation()
  const dcvPath = [...headNodePath, 'Dcv', 'Enabled']

  let dcvEnabled = useState(dcvPath) || false
  let port = useState([...headNodePath, 'Dcv', 'Port']) || 8443
  let allowedIps =
    useState([...headNodePath, 'Dcv', 'AllowedIps']) || '0.0.0.0/0'
  const editing = useState(['app', 'wizard', 'editing'])
  const toggleDcv = (event: any) => {
    const value = !dcvEnabled
    if (value) {
      enableSsm(value)
      if (allowedIps === null)
        setState([...headNodePath, 'Dcv', 'AllowedIps'], '0.0.0.0/0')
      if (port === null) setState([...headNodePath, 'Dcv', 'Port'], 8443)
      setState(dcvPath, value)
    } else {
      clearState([...headNodePath, 'Dcv'])
    }
  }

  const allowedIPsOnChange = React.useCallback(({detail}) => {
    setState([...headNodePath, 'Dcv', 'AllowedIps'], detail.value)
  }, [])

  const allowedPortOnChange = React.useCallback(
    ({detail}) =>
      setState([...headNodePath, 'Dcv', 'Port'], parseInt(detail.value)),
    [],
  )

  return (
    <>
      <CheckboxWithHelpPanel
        disabled={editing}
        checked={dcvEnabled}
        onChange={toggleDcv}
        helpPanel={
          <TitleDescriptionHelpPanel
            title={t('wizard.headNode.Dcv.label')}
            description={t('wizard.headNode.Dcv.help')}
          />
        }
      >
        {t('wizard.headNode.Dcv.add')}
      </CheckboxWithHelpPanel>
      <SpaceBetween direction="vertical" size="xs">
        {dcvEnabled && (
          <FormField label="Allowed IPs">
            <Input value={allowedIps} onChange={allowedIPsOnChange} />
          </FormField>
        )}
        {dcvEnabled && (
          <FormField label="Port">
            <Input
              inputMode="decimal"
              value={port}
              onChange={allowedPortOnChange}
            />
          </FormField>
        )}
      </SpaceBetween>
    </>
  )
}

function IMDSSecuredSettings() {
  const {t} = useTranslation()
  const imdsSecured = useState(imdsSecuredPath) ?? true

  console.log('WAS', useState(imdsSecuredPath))
  React.useEffect(() => {
    console.log('SETTING TO', imdsSecured)
    setState(imdsSecuredPath, imdsSecured)
  }, [])

  const toggleImdsSecured = React.useCallback(() => {
    setState(imdsSecuredPath, !imdsSecured)
  }, [imdsSecured])

  return (
    <CheckboxWithHelpPanel
      checked={imdsSecured}
      onChange={toggleImdsSecured}
      helpPanel={
        <TitleDescriptionHelpPanel
          title={t('wizard.headNode.imdsSecured.label')}
          description={
            <Trans i18nKey="wizard.headNode.imdsSecured.help">
              <a
                rel="noreferrer"
                target="_blank"
                href="https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html#instance-metadata-v2-how-it-works"
              ></a>
            </Trans>
          }
        />
      }
    >
      <Trans i18nKey="wizard.headNode.imdsSecured.set" />
    </CheckboxWithHelpPanel>
  )
}

function HeadNode() {
  const {t} = useTranslation()

  const subnetPath = [...headNodePath, 'Networking', 'SubnetId']
  const instanceTypeErrors = useState([...errorsPath, 'instanceType'])
  const subnetErrors = useState([...errorsPath, 'subnet'])
  const subnetValue = useState(subnetPath) || ''
  const editing = useState(['app', 'wizard', 'editing'])
  const isOnNodeUpdatedActive = useFeatureFlag('on_node_updated')

  useHelpPanel(<HeadNodePropertiesHelpPanel />)

  return (
    <ColumnLayout columns={1}>
      <Container>
        <SpaceBetween direction="vertical" size="s">
          <Box>
            <FormField
              errorText={instanceTypeErrors}
              label={t('wizard.headNode.instanceType.label')}
            >
              <InstanceSelect
                disabled={editing}
                selectId="head-node"
                path={[...headNodePath, 'InstanceType']}
              />
            </FormField>
          </Box>
          <KeypairSelect />
          <RootVolume basePath={headNodePath} errorsPath={errorsPath} />
          <SsmSettings />
          <DcvSettings />
          <IMDSSecuredSettings />
          <FormField
            label={t('wizard.headNode.securityGroups.label')}
            info={
              <InfoLink
                helpPanel={
                  <TitleDescriptionHelpPanel
                    title={t('wizard.headNode.securityGroups.label')}
                    description={t('wizard.headNode.securityGroups.help')}
                  />
                }
              />
            }
          >
            <SecurityGroups basePath={headNodePath} />
          </FormField>
          <ExpandableSection
            headerText={t('wizard.headNode.advancedOptions.label')}
          >
            {isOnNodeUpdatedActive ? (
              <HeadNodeActionsEditor
                basePath={headNodePath}
                errorsPath={errorsPath}
              />
            ) : (
              <ActionsEditor basePath={headNodePath} errorsPath={errorsPath} />
            )}
            <ExpandableSection
              headerText={t(
                'wizard.headNode.advancedOptions.iamPolicies.label',
              )}
            >
              <IamPoliciesEditor basePath={headNodePath} />
            </ExpandableSection>
          </ExpandableSection>
        </SpaceBetween>
      </Container>

      <Container
        header={
          <Header variant="h2">{t('wizard.headNode.networking.header')}</Header>
        }
      >
        <SpaceBetween direction="vertical" size="s">
          <Box>
            <FormField
              label={t('wizard.headNode.networking.subnetId.label')}
              errorText={subnetErrors}
              description={t('wizard.headNode.networking.subnetId.description')}
            ></FormField>
            <SubnetSelect
              disabled={editing}
              value={subnetValue}
              onChange={(subnetId: any) => setState(subnetPath, subnetId)}
            />
          </Box>
          <Box>
            <Alert statusIconAriaLabel="Info">
              {t('wizard.headNode.networking.subnetId.alert')}
            </Alert>
          </Box>
        </SpaceBetween>
      </Container>
    </ColumnLayout>
  )
}

const HeadNodePropertiesHelpPanel = () => {
  const {t} = useTranslation()
  const footerLinks = React.useMemo(
    () => [
      {
        title: t('wizard.headNode.help.instanceSelectionLink.title'),
        href: t('wizard.headNode.help.instanceSelectionLink.href'),
      },
      {
        title: t('wizard.headNode.help.headNodePropertiesLink.title'),
        href: t('wizard.headNode.help.headNodePropertiesLink.href'),
      },
      {
        title: t('wizard.headNode.help.ssmLink.title'),
        href: t('wizard.headNode.help.ssmLink.href'),
      },
      {
        title: t('wizard.headNode.help.dcvLink.title'),
        href: t('wizard.headNode.help.dcvLink.href'),
      },
      {
        title: t('wizard.headNode.help.customActionsLink.title'),
        href: t('wizard.headNode.help.customActionsLink.href'),
      },
    ],
    [t],
  )
  return (
    <TitleDescriptionHelpPanel
      title={t('wizard.headNode.title')}
      description={<Trans i18nKey="wizard.headNode.help.main" />}
      footerLinks={footerLinks}
    />
  )
}

export {HeadNode, headNodeValidate, HeadNodePropertiesHelpPanel}
