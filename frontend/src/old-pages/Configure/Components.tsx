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

// Fameworks
import React, {
  ReactElement,
  useCallback,
  useMemo,
  useState as useStateReact,
} from 'react'
import {useTranslation} from 'react-i18next'
import {useSelector} from 'react-redux'
import {findFirst} from '../../util'

// State / Model
import {
  setState,
  getState,
  useState,
  updateState,
  clearState,
  clearEmptyNest,
  ssmPolicy,
} from '../../store'

// UI Elements
import {
  Autosuggest,
  Button,
  FormField,
  Input,
  SpaceBetween,
  Checkbox,
  Select,
  InputProps,
  CheckboxProps,
  Multiselect,
  MultiselectProps,
  ColumnLayout,
} from '@cloudscape-design/components'

// Components
import {NonCancelableEventHandler} from '@cloudscape-design/components/internal/events'
import TitleDescriptionHelpPanel from '../../components/help-panel/TitleDescriptionHelpPanel'
import InfoLink from '../../components/InfoLink'
import {subnetName} from './util'
import {
  ActionsEditorProps,
  InstanceGroup,
  InstanceType,
  InstanceTypeOption,
} from './Components.types'

// Helper Functions
function strToOption(str: any) {
  return {value: str, label: str}
}

// Selectors
const selectVpc = (state: any) => getState(state, ['app', 'wizard', 'vpc'])
const selectAwsSubnets = (state: any) => getState(state, ['aws', 'subnets'])

function LabeledIcon({label, icon}: any) {
  return (
    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
      {/* eslint-disable-next-line @next/next/no-img-element*/}
      <img style={{width: '30px', height: '30px'}} src={icon} alt={label} />
      <div style={{marginLeft: '20px', minWidth: '150px'}}>{label}</div>
    </div>
  )
}

function SubnetSelect({value, onChange, disabled}: any) {
  const subnets = useSelector(selectAwsSubnets)
  const vpc = useSelector(selectVpc)
  var filteredSubnets =
    subnets &&
    subnets.filter((s: any) => {
      return vpc ? s.VpcId === vpc : true
    })
  if (!subnets) {
    return <div>No Subnets Found.</div>
  }

  const itemToOption = (item: any) => {
    return {
      value: item.SubnetId,
      label: item.SubnetId,
      description:
        item.AvailabilityZone +
        ` - ${item.AvailabilityZoneId}` +
        (subnetName(item) ? ` (${subnetName(item)})` : ''),
    }
  }

  return (
    <Select
      disabled={disabled}
      selectedOption={
        findFirst(filteredSubnets, (x: any) => {
          return x.SubnetId === value
        })
          ? itemToOption(
              findFirst(filteredSubnets, (x: any) => {
                return x.SubnetId === value
              }),
            )
          : {label: 'Please Select A Subnet'}
      }
      onChange={({detail}) => {
        onChange && onChange(detail.selectedOption.value)
      }}
      selectedAriaLabel="Selected"
      options={filteredSubnets.map(itemToOption)}
    />
  )
}

export function useInstanceGroups(): Record<string, InstanceGroup> {
  const {t} = useTranslation()
  const instanceTypes = useState(['aws', 'instanceTypes']) || []

  let groups: {[key: string]: InstanceGroup} = {}

  for (let instance of instanceTypes) {
    let group = 'General Purpose'
    if (instance.InstanceType.startsWith('c6g')) {
      group = 'Graviton'
    } else if (instance.InstanceType.startsWith('c')) {
      group = 'Compute'
    } else if (instance.InstanceType.startsWith('hpc')) {
      group = 'HPC'
    } else if (instance.InstanceType.startsWith('m')) {
      group = 'Mixed'
    } else if (instance.InstanceType.startsWith('r')) {
      group = 'High Memory'
    } else if (
      instance.InstanceType.startsWith('p') ||
      instance.InstanceType.startsWith('g')
    ) {
      group = 'GPU'
    }

    if (!(group in groups)) groups[group] = []

    let tags = [
      t('wizard.components.instanceSelect.instanceType.vCpus', {
        vCpus: instance.VCpuInfo.DefaultVCpus,
      }),
      t('wizard.components.instanceSelect.instanceType.memory', {
        memory: instance.MemoryInfo.SizeInMiB / 1024,
      }),
    ]

    if (Object.keys(instance.GpuInfo).length > 0)
      tags.push(`${instance.GpuInfo.Count} x ${instance.GpuInfo.Name}`)

    groups[group].push({type: instance.InstanceType, tags: tags})
  }
  return groups
}

function InstanceSelect({path, selectId, callback, disabled}: any) {
  const {t} = useTranslation()

  const instanceType = useState(path) || null
  const instanceGroups = useInstanceGroups()

  const instanceToOption = (instance: InstanceType): InstanceTypeOption => {
    return {label: instance.type, value: instance.type, tags: instance.tags}
  }

  const instanceTypeToOption = (
    instanceType: string,
  ): InstanceTypeOption | null => {
    const instances = Object.keys(instanceGroups)
      .map(groupName => instanceGroups[groupName])
      .flat()
    const instance = instances.find(instance => instance.type === instanceType)
    return instance ? instanceToOption(instance) : null
  }

  const [selectedOption, setSelectedOption] = React.useState(
    instanceTypeToOption(instanceType),
  )

  const onChangeHandler = React.useCallback(
    ({detail}) => {
      setSelectedOption(detail.selectedOption as InstanceTypeOption)
      if (detail.selectedOption.value !== instanceType) {
        setState(path, detail.selectedOption.value)
        callback && callback(detail.selectedOption.value)
      }
    },
    [callback, instanceType, path],
  )

  return (
    <Select
      selectedOption={selectedOption}
      disabled={disabled}
      onChange={onChangeHandler}
      ariaLabel={t('wizard.components.instanceSelect.placeholder')}
      placeholder={t('wizard.components.instanceSelect.placeholder')}
      empty={t('wizard.components.instanceSelect.noMatches')}
      triggerVariant="option"
      filteringType="auto"
      options={Object.keys(instanceGroups).map(groupName => {
        return {
          label: groupName,
          options: instanceGroups[groupName].map(instanceToOption),
        }
      })}
    />
  )
}

function CustomAMISettings({basePath, appPath, errorsPath, validate}: any) {
  const editing = useState(['app', 'wizard', 'editing'])
  const customImages = useState(['app', 'wizard', 'customImages']) || []
  const officialImages = useState(['app', 'wizard', 'officialImages']) || []
  const error = useState([...errorsPath, 'customAmi'])

  const customAmiPath = useMemo(
    () => [...basePath, 'Image', 'CustomAmi'],
    [basePath],
  )
  const customAmi = useState(customAmiPath)
  const customAmiEnabled =
    useState([...appPath, 'customAMI', 'enabled']) || false

  const osPath = ['app', 'wizard', 'config', 'Image', 'Os']
  const os = useState(osPath) || 'alinux2'

  const {t} = useTranslation()

  var suggestions = []
  for (let image of customImages) {
    suggestions.push({
      value: image.ec2AmiInfo.amiId,
      description: `${image.ec2AmiInfo.amiId} (${image.imageId})`,
    })
  }

  for (let image of officialImages)
    if (image.os === os) {
      suggestions.push({
        value: image.amiId,
        description: `${image.amiId} (${image.name})`,
      })
    }

  const toggleCustomAmi = () => {
    const value = !customAmiEnabled
    setState([...appPath, 'customAMI', 'enabled'], value)
    if (!value) {
      clearState(customAmiPath)
      if (Object.keys(getState([...basePath, 'Image'])).length === 0)
        clearState([...basePath, 'Image'])
    }
  }

  const selectText = useCallback(
    (value: string) => {
      if (value !== customAmi) {
        setState(customAmiPath, value)
      }
      return value
    },
    [customAmi, customAmiPath],
  )

  const helpPanelFooter = useMemo(
    () => [
      {
        title: t('wizard.components.customAmi.helpPanel.imageLink.title'),
        href: t('wizard.components.customAmi.helpPanel.imageLink.href'),
      },
    ],
    [t],
  )

  return (
    <SpaceBetween size="xxs">
      <CheckboxWithHelpPanel
        checked={customAmiEnabled}
        disabled={editing}
        onChange={toggleCustomAmi}
        helpPanel={
          <TitleDescriptionHelpPanel
            title={t('wizard.components.customAmi.helpPanel.title')}
            description={t('wizard.components.customAmi.helpPanel.description')}
            footerLinks={helpPanelFooter}
          />
        }
      >
        {t('wizard.components.customAmi.label')}
      </CheckboxWithHelpPanel>
      {customAmiEnabled && (
        <FormField
          label={t('wizard.components.customAmi.suggestLabel')}
          errorText={error}
        >
          <Autosuggest
            onChange={({detail}) => {
              if (detail.value !== customAmi) {
                setState(customAmiPath, detail.value)
              }
            }}
            value={customAmi || ''}
            enteredTextLabel={selectText}
            ariaLabel="Custom AMI Selector"
            placeholder="AMI ID"
            empty="No matches found"
            options={suggestions}
          />
        </FormField>
      )}
    </SpaceBetween>
  )
}

function ArgEditor({path, i}: any) {
  const {t} = useTranslation()
  const args = useState(path)
  const arg = useState([...path, i])
  const remove = () => {
    if (args.length > 1)
      setState([...path], [...args.slice(0, i), ...args.slice(i + 1)])
    else clearState(path)

    clearEmptyNest(path, 3)
  }

  return (
    <ColumnLayout columns={2}>
      <Input
        value={arg}
        onChange={({detail}) => {
          setState([...path, i], detail.value)
        }}
        placeholder={t('wizard.components.actionsEditor.argument.placeholder')}
      />
      <Button onClick={remove}>{t('wizard.actions.remove')}</Button>
    </ColumnLayout>
  )
}

function ActionEditor({
  label,
  error,
  path,
}: {
  label: string
  error: string
  path: string[]
}) {
  const script = useState([...path, 'Script']) || ''
  const {t} = useTranslation()
  const args = useState([...path, 'Args']) || []
  const [enabled, setEnabled] = useStateReact(!!script)

  const addArg = (path: any) => {
    updateState(path, (old: any) => [...(old || []), ''])
  }

  const editScript = (path: any, val: any) => {
    if (val !== '') setState(path, val)
    else clearState(path)
    clearEmptyNest(path, 3)
  }

  const toggleCheckbox = useCallback(() => {
    clearState(path)
    setEnabled(!enabled)
  }, [enabled, setEnabled, path])

  return (
    <SpaceBetween direction="vertical" size="xs">
      <Checkbox checked={enabled} onChange={toggleCheckbox}>
        {label}
      </Checkbox>
      {enabled ? (
        <>
          <ColumnLayout columns={2}>
            <FormField errorText={error}>
              <Input
                placeholder="/home/ec2-user/start.sh"
                value={script}
                onChange={({detail}) =>
                  editScript([...path, 'Script'], detail.value)
                }
              />
            </FormField>
            <Button onClick={() => addArg([...path, 'Args'])}>
              {t('wizard.components.actionsEditor.addArgument')}
            </Button>
          </ColumnLayout>
          {args.length > 0 ? (
            <SpaceBetween direction="vertical" size="xs">
              {/* The title is stiled as an empty FormField because the shortest heading is an h3, too big for this case */}
              <FormField
                label={t('wizard.components.actionsEditor.argument.label')}
              />
              {args.map((a: any, i: any) => (
                <ArgEditor
                  key={`osa${i}`}
                  arg={a}
                  i={i}
                  path={[...path, 'Args']}
                />
              ))}
            </SpaceBetween>
          ) : null}
        </>
      ) : null}
    </SpaceBetween>
  )
}

function ActionsEditor({basePath, errorsPath}: ActionsEditorProps) {
  const {t} = useTranslation()

  const actionsPath = [...basePath, 'CustomActions']
  const onStartPath = [...actionsPath, 'OnNodeStart']
  const onConfiguredPath = [...actionsPath, 'OnNodeConfigured']

  const onStartErrors = useState([...errorsPath, 'onStart'])
  const onConfiguredErrors = useState([...errorsPath, 'onConfigured'])

  return (
    <SpaceBetween direction="vertical" size="s">
      <ActionEditor
        label={t('wizard.components.actionsEditor.onStart.label')}
        error={onStartErrors}
        path={onStartPath}
      />
      <ActionEditor
        label={t('wizard.components.actionsEditor.onConfigured.label')}
        error={onConfiguredErrors}
        path={onConfiguredPath}
      />
    </SpaceBetween>
  )
}

function HeadNodeActionsEditor({basePath, errorsPath}: ActionsEditorProps) {
  const {t} = useTranslation()

  const actionsPath = [...basePath, 'CustomActions']
  const onStartPath = [...actionsPath, 'OnNodeStart']
  const onConfiguredPath = [...actionsPath, 'OnNodeConfigured']
  const onUpdatedPath = [...actionsPath, 'OnNodeUpdated']

  const onStartErrors = useState([...errorsPath, 'onStart'])
  const onConfiguredErrors = useState([...errorsPath, 'onConfigured'])
  const onUpdatedErrors = useState([...errorsPath, 'onUpdated'])

  return (
    <SpaceBetween direction="vertical" size="xs">
      <ActionEditor
        label={t('wizard.headNode.advancedOptions.scripts.onStart.label')}
        error={onStartErrors}
        path={onStartPath}
      />
      <ActionEditor
        label={t('wizard.headNode.advancedOptions.scripts.onConfigured.label')}
        error={onConfiguredErrors}
        path={onConfiguredPath}
      />
      <ActionEditor
        label={t('wizard.headNode.advancedOptions.scripts.onUpdated.label')}
        error={onUpdatedErrors}
        path={onUpdatedPath}
      />
    </SpaceBetween>
  )
}

const securityGroupToOption = (item: {GroupId: string; GroupName: string}) => {
  return {
    value: item.GroupId,
    label: item.GroupId,
    description: item.GroupName,
  }
}

function SecurityGroups({basePath}: {basePath: string[]}) {
  const {t} = useTranslation()
  const securityGroupsPath = useMemo(
    () => [...basePath, 'Networking', 'AdditionalSecurityGroups'],
    [basePath],
  )
  const selectedSecurityGroups: string[] = useState(securityGroupsPath) || []
  const availableSecurityGroups = useState(['aws', 'security_groups'])
  const options = useMemo(
    () => (availableSecurityGroups || []).map(securityGroupToOption),
    [availableSecurityGroups],
  )
  const onChange: NonCancelableEventHandler<MultiselectProps.MultiselectChangeDetail> =
    useCallback(
      ({detail}) => {
        setState(
          securityGroupsPath,
          detail.selectedOptions.map(option => option.value),
        )
      },
      [securityGroupsPath],
    )

  return (
    <Multiselect
      selectedOptions={options.filter((opt: any) =>
        selectedSecurityGroups.includes(opt.value),
      )}
      placeholder={t('wizard.headNode.securityGroups.select')}
      onChange={onChange}
      options={options}
    />
  )
}

function RootVolume({basePath, errorsPath}: any) {
  const {t} = useTranslation()
  const rootVolumeSizePath = [...basePath, 'LocalStorage', 'RootVolume', 'Size']
  const rootVolumeSize = useState(rootVolumeSizePath)

  const rootVolumeEncryptedPath = [
    ...basePath,
    'LocalStorage',
    'RootVolume',
    'Encrypted',
  ]
  const rootVolumeEncrypted = useState(rootVolumeEncryptedPath)

  const rootVolumeTypePath = useMemo(
    () => [...basePath, 'LocalStorage', 'RootVolume', 'VolumeType'],
    [basePath],
  )
  const rootVolumeType = useState(rootVolumeTypePath)
  const defaultRootVolumeType = 'gp3'
  const volumeTypes = ['gp3', 'gp2', 'io1', 'io2', 'sc1', 'st1', 'standard']

  const rootVolumeErrors = useState([...errorsPath, 'rootVolume'])
  const editing = useState(['app', 'wizard', 'editing'])

  const setRootVolume = (size: any) => {
    if (size === '') clearState(rootVolumeSizePath)
    else setState(rootVolumeSizePath, parseInt(size))
    clearEmptyNest(rootVolumeSizePath, 3)
  }

  const toggleEncrypted = () => {
    const setEncrypted = !rootVolumeEncrypted
    if (setEncrypted) setState(rootVolumeEncryptedPath, setEncrypted)
    else clearState(rootVolumeEncryptedPath)
    clearEmptyNest(rootVolumeSizePath, 3)
  }

  React.useEffect(() => {
    if (rootVolumeType === null)
      setState(rootVolumeTypePath, defaultRootVolumeType)
  }, [rootVolumeType, rootVolumeTypePath])

  return (
    <SpaceBetween direction="vertical" size="s">
      <FormField
        label={t('wizard.components.rootVolume.size.label')}
        errorText={rootVolumeErrors}
      >
        <Input
          disabled={editing}
          placeholder={t('wizard.components.rootVolume.size.placeholder')}
          value={rootVolumeSize || ''}
          inputMode="decimal"
          type="number"
          onChange={({detail}) => setRootVolume(detail.value)}
        />
      </FormField>
      <FormField label={t('wizard.components.rootVolume.type.label')}>
        <Select
          disabled={editing}
          placeholder={t('wizard.components.rootVolume.type.placeholder', {
            defaultRootVolumeType: defaultRootVolumeType,
          })}
          selectedOption={rootVolumeType && strToOption(rootVolumeType)}
          onChange={({detail}) => {
            setState(rootVolumeTypePath, detail.selectedOption.value)
          }}
          options={volumeTypes.map(strToOption)}
        />
      </FormField>
      <Checkbox
        disabled={editing}
        checked={rootVolumeEncrypted || false}
        onChange={toggleEncrypted}
      >
        {t('wizard.components.rootVolume.encrypted')}
      </Checkbox>
    </SpaceBetween>
  )
}

function IamPoliciesEditor({basePath}: any) {
  const {t} = useTranslation()
  const policiesPath = [...basePath, 'Iam', 'AdditionalIamPolicies']
  const policies = useState(policiesPath) || []
  const policyPath = ['app', 'wizard', 'headNode', 'iamPolicy']
  const policy = useState(policyPath) || ''

  const addPolicy = () => {
    updateState(policiesPath, (existing: any) => [
      ...(existing || []),
      {Policy: policy},
    ])
    setState(policyPath, '')
  }

  const removePolicy = (index: any) => {
    setState(policiesPath, [
      ...policies.slice(0, index),
      ...policies.slice(index + 1),
    ])
    if (policies.length === 0) clearState(policiesPath)
  }

  return (
    <SpaceBetween direction="vertical" size="s">
      <FormField
        errorText={
          findFirst(policies, (x: any) => x.Policy === policy)
            ? t('wizard.components.IamPoliciesEditor.policyAlreadyAdded')
            : ''
        }
      >
        <SpaceBetween direction="horizontal" size="s">
          <div style={{width: '400px'}}>
            <Input
              placeholder="arn:aws:iam::aws:policy/SecretsManager:ReadWrite"
              value={policy}
              onChange={({detail}) => setState(policyPath, detail.value)}
            />
          </div>
          <Button
            onClick={addPolicy}
            disabled={
              policy.length === 0 ||
              findFirst(policies, (x: any) => x.Policy === policy)
            }
          >
            {t('wizard.components.IamPoliciesEditor.addButtonLabel')}
          </Button>
        </SpaceBetween>
      </FormField>
      {policies.map(
        (p: any, i: any) =>
          p.Policy !== ssmPolicy && (
            <SpaceBetween key={p.Policy} direction="horizontal" size="s">
              <div style={{width: '400px'}}>{p.Policy}</div>
              <Button onClick={() => removePolicy(i)}>Remove</Button>
            </SpaceBetween>
          ),
      )}
    </SpaceBetween>
  )
}

type HelpTextInputProps = {
  name: string
  path: string[]
  errorsPath: string[]
  configKey: string
  description: string
  help: string
  placeholder: string
  type?: InputProps.Type
  onChange: NonCancelableEventHandler<InputProps.ChangeDetail>
}

function HelpTextInput({
  name,
  path,
  errorsPath,
  configKey,
  description,
  help,
  placeholder,
  type = 'text',
  onChange,
}: HelpTextInputProps) {
  let value = useState([...path, configKey])
  let error = useState([...errorsPath, configKey])

  return (
    <FormField
      label={name}
      errorText={error}
      description={description}
      info={
        <InfoLink
          ariaLabel={name}
          helpPanel={
            <TitleDescriptionHelpPanel title={name} description={help} />
          }
        />
      }
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{flexGrow: 1}}>
          <Input
            placeholder={placeholder}
            value={value}
            type={type}
            onChange={onChange}
          />
        </div>
      </div>
    </FormField>
  )
}

type CheckboxWithInfoLinkProps = CheckboxProps & {
  helpPanel: ReactElement
}

const CheckboxWithHelpPanel = ({
  helpPanel,
  children,
  ...checkboxProps
}: CheckboxWithInfoLinkProps) => {
  return (
    <SpaceBetween direction="horizontal" size="xs">
      <Checkbox {...checkboxProps}>{children}</Checkbox>
      <InfoLink helpPanel={helpPanel} />
    </SpaceBetween>
  )
}

export {
  SubnetSelect,
  SecurityGroups,
  InstanceSelect,
  LabeledIcon,
  ActionsEditor,
  ActionEditor,
  HeadNodeActionsEditor,
  CustomAMISettings,
  RootVolume,
  IamPoliciesEditor,
  HelpTextInput,
  CheckboxWithHelpPanel,
}
