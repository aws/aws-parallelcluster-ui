import * as React from 'react'
import {
  ColumnLayout,
  FormField,
  Input,
  Multiselect,
  MultiselectProps,
  Checkbox,
  SpaceBetween,
  TextContent,
  Button,
  Box,
} from '@cloudscape-design/components'
import {NonCancelableEventHandler} from '@cloudscape-design/components/internal/events'
import {useCallback, useEffect, useMemo} from 'react'
import {Trans, useTranslation} from 'react-i18next'
import {clearState, setState, useState} from '../../../store'
import {
  CheckboxWithHelpPanel,
  HelpTextInput,
  OdcrCbSelect,
  useInstanceGroups,
} from '../Components'
import {
  ComputeResourceInstance,
  MultiInstanceComputeResource,
  QueueValidationErrors,
} from './queues.types'
import {InstanceType} from '../Components.types'
import TitleDescriptionHelpPanel from '../../../components/help-panel/TitleDescriptionHelpPanel'
import componentsStyle from '../Components.module.css'

const queuesPath = ['app', 'wizard', 'config', 'Scheduling', 'SlurmQueues']
const queuesErrorsPath = ['app', 'wizard', 'errors', 'queues']
const defaultInstanceType = 'c5n.large'

export function allInstancesSupportEFA(
  instances: ComputeResourceInstance[],
  efaInstances: Set<string>,
): boolean {
  if (!instances || !instances.length) {
    return false
  }
  return instances.every(instance => efaInstances.has(instance.InstanceType))
}

function isHpcInstanceSelected(instances: ComputeResourceInstance[]): boolean {
  if (!instances || !instances.length) {
    return false
  }
  return instances.some(instance => instance.InstanceType.startsWith('hpc'))
}

export function ComputeResource({
  index,
  queueIndex,
  computeResource,
  canUseEFA,
}: any) {
  const parentPath = useMemo(() => [...queuesPath, queueIndex], [queueIndex])
  const computeResources: MultiInstanceComputeResource[] = useState([
    ...parentPath,
    'ComputeResources',
  ])
  const path = useMemo(
    () => [...parentPath, 'ComputeResources', index],
    [index, parentPath],
  )
  const errorsPath = [...queuesErrorsPath, queueIndex, 'computeResource', index]
  const typeError = useState([...errorsPath, 'type'])

  const instanceTypePath = useMemo(() => [...path, 'Instances'], [path])
  const instances: ComputeResourceInstance[] = useState(instanceTypePath) || []

  const memoryBasedSchedulingEnabledPath = [
    'app',
    'wizard',
    'config',
    'Scheduling',
    'SlurmSettings',
    'EnableMemoryBasedScheduling',
  ]
  const enableMemoryBasedScheduling = useState(memoryBasedSchedulingEnabledPath)

  const multithreadingDisabledPath = useMemo(
    () => [...path, 'DisableSimultaneousMultithreading'],
    [path],
  )
  const multithreadingDisabled = useState(multithreadingDisabledPath)

  const efaInstances = new Set<string>(useState(['aws', 'efa_instance_types']))
  const enableEFA = useState([...path, 'Efa', 'Enabled']) || false

  const enablePlacementGroupPath = useMemo(
    () => [...parentPath, 'Networking', 'PlacementGroup', 'Enabled'],
    [parentPath],
  )

  const minCount = useState([...path, 'MinCount'])
  const maxCount = useState([...path, 'MaxCount'])

  const instanceGroups = useInstanceGroups()
  const instanceOptions = useMemo(
    () =>
      Object.keys(instanceGroups).map(groupName => {
        return {
          label: groupName,
          options: instanceGroups[groupName].map((instance: InstanceType) => ({
            label: instance.type,
            tags: instance.tags,
            value: instance.type,
          })),
        }
      }),
    [instanceGroups],
  )

  const {t} = useTranslation()

  const remove = () => {
    setState(
      [...parentPath, 'ComputeResources'],
      [
        ...computeResources.slice(0, index),
        ...computeResources.slice(index + 1),
      ],
    )
  }

  const setMinCount = (staticCount: any) => {
    const dynamicCount = maxCount - minCount
    if (staticCount > 0)
      setState([...path, 'MinCount'], !isNaN(staticCount) ? staticCount : 0)
    else clearState([...path, 'MinCount'])
    setState(
      [...path, 'MaxCount'],
      (!isNaN(staticCount) ? staticCount : 0) +
        (!isNaN(dynamicCount) ? dynamicCount : 0),
    )
  }

  const setMaxCount = (dynamicCount: any) => {
    const staticCount = minCount
    setState(
      [...path, 'MaxCount'],
      (!isNaN(staticCount) ? staticCount : 0) +
        (!isNaN(dynamicCount) ? dynamicCount : 0),
    )
  }

  const setSchedulableMemory = (
    schedulableMemoryPath: string[],
    schedulableMemory: string,
  ) => {
    let schedulableMemoryNumber = parseInt(schedulableMemory)
    if (enableMemoryBasedScheduling && !isNaN(schedulableMemoryNumber)) {
      setState(schedulableMemoryPath, schedulableMemoryNumber)
    } else {
      clearState(schedulableMemoryPath)
    }
  }

  const setDisableHT = useCallback(
    (disable: any) => {
      if (disable) setState(multithreadingDisabledPath, disable)
      else clearState(multithreadingDisabledPath)
    },
    [multithreadingDisabledPath],
  )

  const setEnableEFA = useCallback(
    (enable: any) => {
      if (enable) {
        setState([...path, 'Efa', 'Enabled'], enable)
        setState(enablePlacementGroupPath, enable)
      } else {
        clearState([...path, 'Efa'])
        clearState(enablePlacementGroupPath)
      }
    },
    [enablePlacementGroupPath, path],
  )

  const hpcInstanceSelected = isHpcInstanceSelected(instances)

  useEffect(() => {
    if (!canUseEFA) {
      setEnableEFA(false)
    }
  }, [canUseEFA, setEnableEFA])

  useEffect(() => {
    if (hpcInstanceSelected) {
      setDisableHT(false)
    }
  }, [hpcInstanceSelected, setDisableHT])

  const setInstances: NonCancelableEventHandler<MultiselectProps.MultiselectChangeDetail> =
    useCallback(
      ({detail}) => {
        const selectedInstances = (detail.selectedOptions.map(option => ({
          InstanceType: option.value,
        })) || []) as ComputeResourceInstance[]
        setState(instanceTypePath, selectedInstances)
        if (!allInstancesSupportEFA(selectedInstances, efaInstances)) {
          setEnableEFA(false)
        }
      },
      [efaInstances, instanceTypePath, setEnableEFA],
    )

  const [odcrCbOption, setOdcrCbOption] = React.useState('none')
  const [odcrCbInput, setOdcrCbInput] = React.useState('')

  const capacityReservationTargetPath = useMemo(
    () => [...path, 'CapacityReservationTarget'],
    [path],
  )

  React.useEffect(() => {
    if (odcrCbOption === 'none') {
      clearState(capacityReservationTargetPath)
    } else {
      const updateData = {
        CapacityReservationId: odcrCbOption === 'capacityReservationId' ? odcrCbInput : undefined,
        CapacityReservationResourceGroupArn: odcrCbOption === 'capacityReservationResourceGroupArn' ? odcrCbInput : undefined,
      }
      setState(capacityReservationTargetPath, updateData)
    }
  }, [odcrCbOption, odcrCbInput])

  return (
    <SpaceBetween direction="vertical" size="s">
      <div className={componentsStyle['space-between-wrap']}>
        <TextContent>
          <h4>
            {t('wizard.queues.computeResource.name', {
              index: index + 1,
              crName: computeResource.Name,
            })}
          </h4>
        </TextContent>
        {computeResources.length > 1 && (
          <Button onClick={remove}>
            {t(
              'wizard.queues.computeResource.removeComputeResourceButton.label',
            )}
          </Button>
        )}
      </div>
      <ColumnLayout columns={2}>
        <SpaceBetween direction="horizontal" size="l">
          <FormField label={t('wizard.queues.computeResource.staticNodes')}>
            <Input
              value={computeResource.MinCount || 0}
              type="number"
              onChange={({detail}) => setMinCount(parseInt(detail.value))}
            />
          </FormField>
          <FormField label={t('wizard.queues.computeResource.dynamicNodes')}>
            <Input
              value={Math.max(
                (computeResource.MaxCount || 0) -
                  (computeResource.MinCount || 0),
                0,
              ).toString()}
              type="number"
              onChange={({detail}) => setMaxCount(parseInt(detail.value))}
            />
          </FormField>
        </SpaceBetween>
        <FormField
          label={t('wizard.queues.computeResource.instanceType.label')}
          errorText={typeError}
        >
          <Multiselect
            selectedOptions={instances.map(instance => ({
              value: instance.InstanceType,
              label: instance.InstanceType,
            }))}
            placeholder={t(
              'wizard.queues.computeResource.instanceType.placeholder.multiple',
            )}
            tokenLimit={3}
            onChange={setInstances}
            options={instanceOptions}
            filteringType="auto"
          />
        </FormField>
        {enableMemoryBasedScheduling && (
          <HelpTextInput
            name={t('wizard.queues.schedulableMemory.name')}
            path={path}
            errorsPath={errorsPath}
            configKey={'SchedulableMemory'}
            onChange={({detail}) =>
              setSchedulableMemory([...path, 'SchedulableMemory'], detail.value)
            }
            description={t('wizard.queues.schedulableMemory.description')}
            placeholder={t('wizard.queues.schedulableMemory.placeholder')}
            help={t('wizard.queues.schedulableMemory.help')}
            type="number"
          />
        )}
      </ColumnLayout>
      <SpaceBetween direction="vertical" size="s">
        <OdcrCbSelect
          selectedOption={odcrCbOption}
          onChange={({detail}) => {
            setOdcrCbOption(detail.selectedOption.value)
            if (detail.selectedOption.value === 'none') {
              setOdcrCbInput('')
            }
          }}
          inputValue={odcrCbInput}
          onInputChange={({detail}) => setOdcrCbInput(detail.value)}
        />
        <CheckboxWithHelpPanel
          checked={multithreadingDisabled}
          disabled={hpcInstanceSelected}
          onChange={_e => {
            setDisableHT(!multithreadingDisabled)
          }}
          helpPanel={
            <TitleDescriptionHelpPanel
              title={t(
                'wizard.queues.computeResource.disableHT.helpPanel.title',
              )}
              description={t(
                'wizard.queues.computeResource.disableHT.helpPanel.description',
              )}
            />
          }
        >
          <Trans i18nKey="wizard.queues.computeResource.disableHT.label" />
        </CheckboxWithHelpPanel>
        <Checkbox
          disabled={
            !allInstancesSupportEFA(instances, efaInstances) || !canUseEFA
          }
          checked={enableEFA}
          onChange={_e => {
            setEnableEFA(!enableEFA)
          }}
        >
          <Trans i18nKey="wizard.queues.computeResource.enableEfa" />
        </Checkbox>
      </SpaceBetween>
    </SpaceBetween>
  )
}

export function createComputeResource(
  queueName: string,
  crIndex: number,
): MultiInstanceComputeResource {
  return {
    Name: `${queueName}-cr-${crIndex + 1}`,
    Instances: [
      {
        InstanceType: defaultInstanceType,
      },
    ],
    MinCount: 0,
    MaxCount: 4,
  }
}

export function updateComputeResourcesNames(
  computeResources: MultiInstanceComputeResource[],
  newQueueName: string,
): MultiInstanceComputeResource[] {
  return computeResources.map((cr, i) => ({
    ...cr,
    Name: `${newQueueName}-cr-${i}`,
  }))
}

export function validateComputeResources(
  computeResources: MultiInstanceComputeResource[],
): [boolean, QueueValidationErrors] {
  let errors = computeResources.reduce<QueueValidationErrors>((acc, cr, i) => {
    if (!cr.Instances || !cr.Instances.length) {
      acc[i] = 'instance_types_empty'
    }
    return acc
  }, {})
  return [Object.keys(errors).length === 0, errors]
}
