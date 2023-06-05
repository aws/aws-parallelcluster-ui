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
import i18next from 'i18next'
import {findFirst} from '../../../util'

// UI Elements
import {
  Button,
  Container,
  ColumnLayout,
  ExpandableSection,
  FormField,
  Header,
  Input,
  Select,
  SpaceBetween,
  Checkbox,
  MultiselectProps,
} from '@cloudscape-design/components'

// State
import {setState, getState, useState, clearState} from '../../../store'

// Components
import {
  ActionsEditor,
  CustomAMISettings,
  RootVolume,
  SecurityGroups,
  IamPoliciesEditor,
  SubnetSelect,
} from '../Components'
import {Trans, useTranslation} from 'react-i18next'
import {SlurmMemorySettings, validateSlurmSettings} from './SlurmMemorySettings'
import {
  isFeatureEnabled,
  useFeatureFlag,
} from '../../../feature-flags/useFeatureFlag'
import * as SingleInstanceCR from './SingleInstanceComputeResource'
import * as MultiInstanceCR from './MultiInstanceComputeResource'
import {
  AllocationStrategy,
  ClusterResourcesLimits,
  ComputeResource,
  Queue,
} from './queues.types'
import {SubnetMultiSelect} from './SubnetMultiSelect'
import {NonCancelableEventHandler} from '@cloudscape-design/components/internal/events'
import TitleDescriptionHelpPanel from '../../../components/help-panel/TitleDescriptionHelpPanel'
import {useHelpPanel} from '../../../components/help-panel/HelpPanel'
import {
  validateQueueName,
  queueNameErrorsMapping,
  QUEUE_NAME_MAX_LENGTH,
} from './queues.validators'
import InfoLink from '../../../components/InfoLink'

// Constants
const queuesPath = ['app', 'wizard', 'config', 'Scheduling', 'SlurmQueues']
const queuesErrorsPath = ['app', 'wizard', 'errors', 'queues']
const defaultRegion = getState(['aws', 'region'])

export function useClusterResourcesLimits(): ClusterResourcesLimits {
  const newResourcesLimits = useFeatureFlag('new_resources_limits')
  return newResourcesLimits
    ? {maxQueues: 50, maxCRPerQueue: 50, maxCRPerCluster: 50}
    : {maxQueues: 10, maxCRPerQueue: 5, maxCRPerCluster: 50}
}

function itemToOption([value, label]: string[]) {
  return {
    value: value,
    label: label,
  }
}

function queueValidate(queueIndex: any) {
  let valid = true
  const queueSubnet = getState([
    ...queuesPath,
    queueIndex,
    'Networking',
    'SubnetIds',
    0,
  ])
  const computeResources = getState([
    ...queuesPath,
    queueIndex,
    'ComputeResources',
  ])

  const errorsPath = [...queuesErrorsPath, queueIndex]

  const actionsPath = [...queuesPath, queueIndex, 'CustomActions']

  const onStartPath = [...actionsPath, 'OnNodeStart']
  const onStart = getState(onStartPath)

  const onConfiguredPath = [...actionsPath, 'OnNodeConfigured']
  const onConfigured = getState(onConfiguredPath)

  const customAmiEnabled = getState([
    'app',
    'wizard',
    'queues',
    queueIndex,
    'customAMI',
    'enabled',
  ])
  const customAmi = getState([...queuesPath, queueIndex, 'Image', 'CustomAmi'])

  const queueName = getState([...queuesPath, queueIndex, 'Name'])
  const [queueNameValid, error] = validateQueueName(queueName)
  if (!queueNameValid) {
    let errorMessage: string
    if (error === 'max_length') {
      errorMessage = i18next.t(queueNameErrorsMapping[error], {
        maxChars: QUEUE_NAME_MAX_LENGTH,
      })
    } else {
      errorMessage = i18next.t(queueNameErrorsMapping[error])
    }
    setState([...errorsPath, 'name'], errorMessage)
    valid = false
  } else {
    clearState([...errorsPath, 'name'])
  }

  const rootVolumeSizePath = [
    ...queuesPath,
    queueIndex,
    'ComputeSettings',
    'LocalStorage',
    'RootVolume',
    'Size',
  ]
  const rootVolumeValue = getState(rootVolumeSizePath)

  if (rootVolumeValue === '') {
    setState(
      [...errorsPath, 'rootVolume'],
      i18next.t('wizard.queues.validation.setRootVolumeSize'),
    )
    valid = false
  } else if (
    rootVolumeValue &&
    (!Number.isInteger(rootVolumeValue) || rootVolumeValue < 35)
  ) {
    setState(
      [...errorsPath, 'rootVolume'],
      i18next.t('wizard.queues.validation.rootVolumeMinimum'),
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
      i18next.t('wizard.queues.validation.rootVolumeMinimum'),
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
      i18next.t('wizard.queues.validation.scriptWithArgs'),
    )
    valid = false
  } else {
    clearState([...errorsPath, 'onConfigured'])
  }

  if (customAmiEnabled && !customAmi) {
    setState(
      [...errorsPath, 'customAmi'],
      i18next.t('wizard.queues.validation.customAmiSelect'),
    )
    valid = false
  } else {
    clearState([...errorsPath, 'customAmi'])
  }

  const version = getState(['app', 'version', 'full'])
  const isMultiAZActive = isFeatureEnabled(version, defaultRegion, 'multi_az')
  if (!queueSubnet) {
    let message: string
    if (isMultiAZActive) {
      message = i18next.t('wizard.queues.validation.selectSubnets')
    } else {
      message = i18next.t('wizard.queues.validation.selectSubnet')
    }
    setState([...errorsPath, 'subnet'], message)
    valid = false
  } else {
    setState([...errorsPath, 'subnet'], null)
  }

  const isMultiInstanceTypesActive = isFeatureEnabled(
    version,
    defaultRegion,
    'queues_multiple_instance_types',
  )
  const {validateComputeResources} = !isMultiInstanceTypesActive
    ? SingleInstanceCR
    : MultiInstanceCR
  const [computeResourcesValid, computeResourcesErrors] =
    validateComputeResources(computeResources)
  if (!computeResourcesValid) {
    valid = false
    computeResources.forEach((_: ComputeResource, i: number) => {
      const error = computeResourcesErrors[i]
      if (error) {
        let message: string
        if (error === 'instance_type_unique') {
          message = i18next.t('wizard.queues.validation.instanceTypeUnique')
        } else {
          message = i18next.t('wizard.queues.validation.instanceTypeMissing')
        }
        setState([...errorsPath, 'computeResource', i, 'type'], message)
      } else {
        setState([...errorsPath, 'computeResource', i, 'type'], null)
      }
    })
  }

  const isMemoryBasedSchedulingActive = isFeatureEnabled(
    version,
    defaultRegion,
    'memory_based_scheduling',
  )
  if (isMemoryBasedSchedulingActive) {
    const settingsValid = validateSlurmSettings()
    if (!settingsValid) {
      valid = false
    }
  }

  return valid
}

function queuesValidate() {
  let valid = true
  const config = getState(['app', 'wizard', 'config'])
  console.log(config)

  setState([...queuesErrorsPath, 'validated'], true)

  const queues = getState([...queuesPath])
  for (let i = 0; i < queues.length; i++) {
    let queueValid = queueValidate(i)
    valid &&= queueValid
  }

  return valid
}

function ComputeResources({queue, index, canUseEFA}: any) {
  const {t} = useTranslation()
  const {ViewComponent} = useComputeResourceAdapter()
  const computeResourceAdapter = useComputeResourceAdapter()

  const {maxCRPerCluster, maxCRPerQueue} = useClusterResourcesLimits()
  const queues = useState([...queuesPath])
  const currentComputeResources = React.useMemo(
    () =>
      queues
        .map((queue: Queue) => queue.ComputeResources.length)
        .reduce(
          (total: number, computeResources: number) => total + computeResources,
          0,
        ),
    [queues],
  )

  const addComputeResource = () => {
    const existingCRs = queue.ComputeResources || []
    setState([...queuesPath, index], {
      ...queue,
      ComputeResources: [
        ...existingCRs,
        computeResourceAdapter.createComputeResource(
          queue.Name,
          existingCRs.length,
        ),
      ],
    })
  }

  return (
    <>
      <Header
        variant="h3"
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              disabled={
                queue.ComputeResources.length >= maxCRPerQueue ||
                currentComputeResources >= maxCRPerCluster
              }
              onClick={addComputeResource}
            >
              {t('wizard.queues.computeResource.addComputeResource')}
            </Button>
          </SpaceBetween>
        }
        description={t('wizard.queues.computeResource.header.description', {
          limit: maxCRPerQueue,
        })}
      >
        {t('wizard.queues.computeResource.header.title')}
      </Header>
      <ColumnLayout borders="horizontal">
        {queue.ComputeResources.map((computeResource: any, i: any) => (
          <ViewComponent
            queue={queue}
            computeResource={computeResource}
            index={i}
            queueIndex={index}
            key={i}
            canUseEFA={canUseEFA}
          />
        ))}
      </ColumnLayout>
    </>
  )
}

const useAllocationStrategyOptions = () => {
  const {t} = useTranslation()
  const options = React.useMemo(
    () => [
      {
        label: t('wizard.queues.allocationStrategy.lowestPrice'),
        value: 'lowest-price',
      },
      {
        label: t('wizard.queues.allocationStrategy.capacityOptimized'),
        value: 'capacity-optimized',
      },
    ],
    [t],
  )
  return options
}

function Queue({index}: any) {
  const {t} = useTranslation()
  const queues = useState(queuesPath)
  const {maxQueues, maxCRPerCluster} = useClusterResourcesLimits()
  const computeResourceAdapter = useComputeResourceAdapter()
  const queue = useState([...queuesPath, index])
  const enablePlacementGroupPath = React.useMemo(
    () => [...queuesPath, index, 'Networking', 'PlacementGroup', 'Enabled'],
    [index],
  )
  const enablePlacementGroup = useState(enablePlacementGroupPath)

  const isMultiInstanceTypesActive = useFeatureFlag(
    'queues_multiple_instance_types',
  )
  const allocationStrategyOptions = useAllocationStrategyOptions()

  const errorsPath = [...queuesErrorsPath, index]
  const subnetError = useState([...errorsPath, 'subnet'])
  const nameError = useState([...errorsPath, 'name'])

  const allocationStrategy: AllocationStrategy = useState([
    ...queuesPath,
    index,
    'AllocationStrategy',
  ])

  const capacityTypes: [string, string, string][] = [
    ['ONDEMAND', 'On-Demand', '/img/od.svg'],
    ['SPOT', 'Spot', '/img/spot.svg'],
  ]
  const capacityTypePath = [...queuesPath, index, 'CapacityType']
  const capacityType: string = useState(capacityTypePath) || 'ONDEMAND'

  const subnetPath = [...queuesPath, index, 'Networking', 'SubnetIds']
  const subnetsList = useState(subnetPath) || []
  const isMultiAZActive = useFeatureFlag('multi_az')

  const remove = () => {
    setState(
      [...queuesPath],
      [...queues.slice(0, index), ...queues.slice(index + 1)],
    )
  }

  const setEnablePG = React.useCallback(
    (enable: any) => {
      setState(enablePlacementGroupPath, enable)
    },
    [enablePlacementGroupPath],
  )

  const onSubnetMultiSelectChange: NonCancelableEventHandler<MultiselectProps.MultiselectChangeDetail> =
    React.useCallback(
      ({detail}) => {
        setSubnetsAndValidate(index, queueValidate, detail)
      },
      [index],
    )

  const onSubnetSelectChange = React.useCallback(
    (subnetId: string) => {
      setState(subnetPath, [subnetId])
      queueValidate(index)
    },
    [subnetPath, index],
  )

  const {canUseEFA, canUsePlacementGroup} = areMultiAZSelected(subnetsList)
  React.useEffect(() => {
    if (!canUsePlacementGroup) {
      setEnablePG(false)
    }
  }, [canUsePlacementGroup, setEnablePG])

  const renameQueue = (newName: any) => {
    const computeResources = getState([
      ...queuesPath,
      index,
      'ComputeResources',
    ])
    const updatedCRs = computeResourceAdapter.updateComputeResourcesNames(
      computeResources,
      newName,
    )
    setState([...queuesPath, index, 'Name'], newName)
    setState([...queuesPath, index, 'ComputeResources'], updatedCRs)
  }

  const setAllocationStrategy = React.useCallback(
    ({detail}) => {
      setState(
        [...queuesPath, index, 'AllocationStrategy'],
        detail.selectedOption.value,
      )
    },
    [index],
  )

  const defaultAllocationStrategy = useDefaultAllocationStrategy()

  const addQueue = () => {
    const queueName = `queue-${queues.length + 1}`
    setState(
      [...queuesPath],
      [
        ...(queues || []),
        {
          Name: queueName,
          ...defaultAllocationStrategy,
          ComputeResources: [
            computeResourceAdapter.createComputeResource(queueName, 0),
          ],
        },
      ],
    )
  }

  const purchaseTypeFooterLinks = React.useMemo(
    () => [
      {
        title: t('wizard.queues.purchaseType.helpPanel.link.title'),
        href: t('wizard.queues.purchaseType.helpPanel.link.href'),
      },
    ],
    [t],
  )

  const allocationStrategyFooterLinks = React.useMemo(
    () => [
      {
        title: t('wizard.queues.allocationStrategy.helpPanel.link.title'),
        href: t('wizard.queues.allocationStrategy.helpPanel.link.href'),
      },
    ],
    [t],
  )

  const totalComputeResources = React.useMemo(
    () =>
      queues
        .map((queue: Queue) => queue.ComputeResources.length)
        .reduce(
          (total: number, computeResources: number) => total + computeResources,
          0,
        ),
    [queues],
  )

  const canAddQueue =
    queues.length < maxQueues && totalComputeResources < maxCRPerCluster

  return (
    <Container
      header={
        <Header
          variant="h2"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button disabled={!canAddQueue} onClick={addQueue}>
                {t('wizard.queues.addQueueButton.label')}
              </Button>
              {queues.length > 1 && (
                <Button onClick={remove}>
                  {t('wizard.queues.removeQueueButton.label')}
                </Button>
              )}
            </SpaceBetween>
          }
        >
          {t('wizard.queues.container.title', {
            index: index + 1,
            queueName: queue.Name,
          })}
        </Header>
      }
      footer={
        <ExpandableSection
          headerText={t('wizard.queues.advancedOptions.label')}
          variant="footer"
        >
          <SpaceBetween direction="vertical" size="xs">
            <FormField label={t('wizard.queues.securityGroups.label')}>
              <SecurityGroups basePath={[...queuesPath, index]} />
            </FormField>
            <CustomAMISettings
              basePath={[...queuesPath, index]}
              appPath={['app', 'wizard', 'queues', index]}
              errorsPath={errorsPath}
              validate={queuesValidate}
            />
            <Header variant="h3">
              {t('wizard.queues.advancedOptions.scripts.title')}
            </Header>
            <ActionsEditor
              basePath={[...queuesPath, index]}
              errorsPath={errorsPath}
            />
            <Header variant="h3">
              {t('wizard.queues.advancedOptions.rootVolume.title')}
            </Header>
            <RootVolume
              basePath={[...queuesPath, index, 'ComputeSettings']}
              errorsPath={errorsPath}
            />
            <Header variant="h3">
              {t('wizard.queues.advancedOptions.iamPolicies.label')}
            </Header>
            <IamPoliciesEditor basePath={[...queuesPath, index]} />
          </SpaceBetween>
        </ExpandableSection>
      }
    >
      <SpaceBetween direction="vertical" size="s">
        <ColumnLayout borders="horizontal">
          <SpaceBetween direction="vertical" size="m">
            <ColumnLayout columns={2}>
              <FormField
                label={t('wizard.queues.name.label')}
                errorText={nameError}
              >
                <Input
                  value={queue.Name}
                  placeholder={t('wizard.queues.name.placeholder')}
                  onKeyDown={e => {
                    if (e.detail.key === 'Enter' || e.detail.key === 'Escape') {
                      e.stopPropagation()
                      queueValidate(index)
                    }
                  }}
                  onChange={({detail}) => renameQueue(detail.value)}
                />
              </FormField>
            </ColumnLayout>
            <ColumnLayout columns={2}>
              <FormField
                label={
                  isMultiAZActive
                    ? t('wizard.queues.subnet.label.multiple')
                    : t('wizard.queues.subnet.label.single')
                }
                errorText={subnetError}
              >
                {isMultiAZActive ? (
                  <SubnetMultiSelect
                    value={subnetsList}
                    onChange={onSubnetMultiSelectChange}
                  />
                ) : (
                  <SubnetSelect
                    value={subnetsList[0]}
                    onChange={onSubnetSelectChange}
                  />
                )}
              </FormField>
              <Checkbox
                checked={enablePlacementGroup}
                disabled={!canUsePlacementGroup}
                onChange={_e => {
                  setEnablePG(!enablePlacementGroup)
                }}
              >
                <Trans i18nKey="wizard.queues.placementGroup.label" />
              </Checkbox>
              <FormField
                label={t('wizard.queues.purchaseType.label')}
                info={
                  <InfoLink
                    helpPanel={
                      <TitleDescriptionHelpPanel
                        title={t('wizard.queues.purchaseType.helpPanel.title')}
                        description={t(
                          'wizard.queues.purchaseType.helpPanel.description',
                        )}
                        footerLinks={purchaseTypeFooterLinks}
                      />
                    }
                  />
                }
              >
                <Select
                  selectedOption={itemToOption(
                    findFirst(capacityTypes, x => x[0] === capacityType) || [
                      '',
                      '',
                    ],
                  )}
                  onChange={({detail}) => {
                    setState(capacityTypePath, detail.selectedOption.value)
                  }}
                  options={capacityTypes.map(itemToOption)}
                />
              </FormField>
              {isMultiInstanceTypesActive ? (
                <FormField
                  label={t('wizard.queues.allocationStrategy.title')}
                  info={
                    <InfoLink
                      helpPanel={
                        <TitleDescriptionHelpPanel
                          title={t(
                            'wizard.queues.allocationStrategy.helpPanel.title',
                          )}
                          description={t(
                            'wizard.queues.allocationStrategy.helpPanel.description',
                          )}
                          footerLinks={allocationStrategyFooterLinks}
                        />
                      }
                    />
                  }
                >
                  <Select
                    options={allocationStrategyOptions}
                    selectedOption={
                      allocationStrategyOptions.find(
                        as => as.value === allocationStrategy,
                      )!
                    }
                    onChange={setAllocationStrategy}
                  />
                </FormField>
              ) : null}
            </ColumnLayout>
          </SpaceBetween>
          <ComputeResources queue={queue} index={index} canUseEFA={canUseEFA} />
        </ColumnLayout>
      </SpaceBetween>
    </Container>
  )
}

const headNodeSubnetPath = [
  'app',
  'wizard',
  'config',
  'HeadNode',
  'Networking',
  'SubnetId',
]

const DEFAULT_QUEUES: Queue[] = []

function QueuesView() {
  const queues = useState(queuesPath) || DEFAULT_QUEUES
  const headNodeSubnet = useState(headNodeSubnetPath)

  React.useEffect(() => {
    queues.forEach((queue: Queue, i: number) => {
      if (!queue.Networking?.SubnetIds) {
        setState(
          [
            'app',
            'wizard',
            'config',
            'Scheduling',
            'SlurmQueues',
            i,
            'Networking',
            'SubnetIds',
          ],
          [headNodeSubnet],
        )
      }
    })
  }, [headNodeSubnet, queues])

  return (
    <SpaceBetween direction="vertical" size="l">
      {queues.map((queue: any, i: any) => (
        <Queue queue={queue} index={i} key={i} />
      ))}
    </SpaceBetween>
  )
}

function Queues() {
  const isMemoryBasedSchedulingActive = useFeatureFlag(
    'memory_based_scheduling',
  )

  useHelpPanel(<QueuesHelpPanel />)

  return (
    <ColumnLayout>
      {isMemoryBasedSchedulingActive && <SlurmMemorySettings />}
      <QueuesView />
    </ColumnLayout>
  )
}

export const useDefaultAllocationStrategy = () => {
  const isMultiInstanceTypesActive = useFeatureFlag(
    'queues_multiple_instance_types',
  )
  return !isMultiInstanceTypesActive
    ? undefined
    : {
        AllocationStrategy: 'lowest-price',
      }
}

export const useComputeResourceAdapter = () => {
  const isMultiInstanceTypesActive = useFeatureFlag(
    'queues_multiple_instance_types',
  )
  return !isMultiInstanceTypesActive
    ? {
        ViewComponent: SingleInstanceCR.ComputeResource,
        updateComputeResourcesNames:
          SingleInstanceCR.updateComputeResourcesNames,
        createComputeResource: SingleInstanceCR.createComputeResource,
        validateComputeResources: SingleInstanceCR.validateComputeResources,
      }
    : {
        ViewComponent: MultiInstanceCR.ComputeResource,
        updateComputeResourcesNames:
          MultiInstanceCR.updateComputeResourcesNames,
        createComputeResource: MultiInstanceCR.createComputeResource,
        validateComputeResources: MultiInstanceCR.validateComputeResources,
      }
}

export const areMultiAZSelected = (subnets: string[]) => {
  if (subnets.length <= 1) {
    return {
      multiAZ: false,
      canUseEFA: true,
      canUsePlacementGroup: true,
    }
  }
  return {
    multiAZ: true,
    canUseEFA: false,
    canUsePlacementGroup: false,
  }
}

export function setSubnetsAndValidate(
  queueIndex: number,
  queueValidate: (index: number) => boolean,
  detail: MultiselectProps.MultiselectChangeDetail,
) {
  const subnetPath = [
    'app',
    'wizard',
    'config',
    'Scheduling',
    'SlurmQueues',
    queueIndex,
    'Networking',
    'SubnetIds',
  ]
  const subnetIds =
    detail.selectedOptions.map((option: any) => option.value) || []
  setState(subnetPath, subnetIds)
  queueValidate(queueIndex)
}

export const QueuesHelpPanel = () => {
  const {t} = useTranslation()
  const footerLinks = React.useMemo(
    () => [
      {
        title: t('wizard.queues.help.schedulerLink.title'),
        href: t('wizard.queues.help.schedulerLink.href'),
      },
      {
        title: t('wizard.queues.help.customActionsLink.title'),
        href: t('wizard.queues.help.customActionsLink.href'),
      },
      {
        title: t('wizard.queues.help.amiLink.title'),
        href: t('wizard.queues.help.amiLink.href'),
      },
    ],
    [t],
  )
  return (
    <TitleDescriptionHelpPanel
      title={t('wizard.queues.title')}
      description={<Trans i18nKey="wizard.queues.help.main" />}
      footerLinks={footerLinks}
    />
  )
}

export {Queues, queuesValidate}
