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
import React, {useCallback, useState as reactUseState} from 'react'
import i18next from 'i18next'
import {Trans, useTranslation} from 'react-i18next'
import {clamp} from '../../util'

// UI Elements
import {
  Button,
  ColumnLayout,
  Container,
  FormField,
  Header,
  Input,
  InputProps,
  Select,
  SpaceBetween,
  Checkbox,
  Alert,
  Link,
} from '@cloudscape-design/components'

// State
import {getState, setState, useState, clearState} from '../../store'

// Components
import {
  DeletionPolicy,
  EbsDeletionPolicy,
  EfsDeletionPolicy,
  FsxLustreDeletionPolicy,
  Storages,
  Storage,
  StorageType,
  STORAGE_TYPE_PROPS,
  UIStorageSettings,
  EbsStorage,
  EfsStorage,
} from './Storage.types'
import {useFeatureFlag} from '../../feature-flags/useFeatureFlag'
import InfoLink from '../../components/InfoLink'
import TitleDescriptionHelpPanel from '../../components/help-panel/TitleDescriptionHelpPanel'
import {useMemo} from 'react'
import {useHelpPanel} from '../../components/help-panel/HelpPanel'
import {
  ebsErrorsMapping,
  efsErrorsMapping,
  externalFsErrorsMapping,
  storageNameErrorsMapping,
  STORAGE_NAME_MAX_LENGTH,
  validateEbs,
  validateEfs,
  validateExternalFileSystem,
  validateStorageName,
} from './Storage/storage.validators'
import {NonCancelableEventHandler} from '@cloudscape-design/components/internal/events'
import {BaseChangeDetail} from '@cloudscape-design/components/input/interfaces'
import {AddStorageForm} from './Storage/AddStorageForm'
import {buildStorageEntries} from './Storage/buildStorageEntries'
import {CheckboxWithHelpPanel} from './Components'
import {DeletionPolicyFormField} from './Storage/DeletionPolicyFormField'

// Constants
const storagePath = ['app', 'wizard', 'config', 'SharedStorage']
const errorsPath = ['app', 'wizard', 'errors', 'sharedStorage']
const uiSettingsPath = ['app', 'wizard', 'storage', 'ui']

// Types
export type StorageTypeOption = [StorageType, string]

// Helper Functions
export function itemToOption([value, label]: StorageTypeOption) {
  return {value: value, label: label}
}

function strToOption(str: any) {
  return {value: str, label: str.toString()}
}

function storageValidate() {
  const storages: Storages = getState(storagePath)
  let valid = true

  if (storages) {
    storages.forEach((storage: Storage, index: number) => {
      const settings = `${storage.StorageType}Settings`
      //TODO Add idType as an attribute within STORAGE_TYPE_PROPS to avoid nested ternary operations.
      const idType = STORAGE_TYPE_PROPS[storage.StorageType].mountFilesystem
        ? 'FileSystemId'
        : storage.StorageType == 'FileCache'
        ? 'FileCacheId'
        : 'VolumeId'
      const useExisting =
        getState(['app', 'wizard', 'storage', 'ui', index, 'useExisting']) ||
        !(STORAGE_TYPE_PROPS[storage.StorageType].maxToCreate > 0)

      if (useExisting) {
        const [externalFsValid, error] = validateExternalFileSystem(storage)
        if (!externalFsValid) {
          const errorMessage = i18next.t(externalFsErrorsMapping[error!])
          setState([...errorsPath, index, settings, idType], errorMessage)
          valid = false
        } else {
          clearState([...errorsPath, index, settings, idType])
        }
      } else {
        if (storage.StorageType === 'Ebs') {
          const [ebsValid, error] = validateEbs(storage as EbsStorage)
          if (!ebsValid) {
            const errorMessage = i18next.t(ebsErrorsMapping[error!])
            setState(
              [...errorsPath, index, 'EbsSettings', 'Size'],
              errorMessage,
            )
            valid = false
          } else {
            clearState([...errorsPath, index, 'EbsSettings', 'Size'])
          }
        }
        if (storage.StorageType === 'Efs') {
          const [efsValid, error] = validateEfs(storage as EfsStorage)
          if (!efsValid) {
            const errorMessage = i18next.t(efsErrorsMapping[error!])
            setState(
              [...errorsPath, index, 'EfsSettings', 'ProvisionedThroughput'],
              errorMessage,
            )
            valid = false
          } else {
            clearState([
              ...errorsPath,
              index,
              'EfsSettings',
              'ProvisionedThroughput',
            ])
          }
        }
      }

      const name = getState([...storagePath, index, 'Name'])
      const [nameValid, error] = validateStorageName(name)
      if (!nameValid) {
        let errorMessage: string
        if (error === 'max_length') {
          errorMessage = i18next.t(storageNameErrorsMapping[error], {
            maxChars: STORAGE_NAME_MAX_LENGTH,
          })
        } else {
          errorMessage = i18next.t(storageNameErrorsMapping[error!])
        }
        setState([...errorsPath, index, 'Name'], errorMessage)
        valid = false
      } else {
        clearState([...errorsPath, index, 'Name'])
      }
    })
  }

  setState([...errorsPath, 'validated'], true)
  return valid
}

const LUSTRE_PERSISTENT1_DEFAULT_THROUGHPUT = 200
const LUSTRE_PERSISTENT2_DEFAULT_THROUGHPUT = 125
const storageThroughputsP1 = [50, 100, LUSTRE_PERSISTENT1_DEFAULT_THROUGHPUT]
const storageThroughputsP2 = [
  LUSTRE_PERSISTENT2_DEFAULT_THROUGHPUT,
  250,
  500,
  1000,
]

const DEFAULT_DELETION_POLICY: DeletionPolicy = 'Retain'

function isPersistentFsx(lustreType: string): boolean {
  return ['PERSISTENT_1', 'PERSISTENT_2'].includes(lustreType)
}

function setDefaultStorageThroughput(
  lustreType: string,
  storageThroughputPath: string[],
) {
  if (isPersistentFsx(lustreType)) {
    setState(
      storageThroughputPath,
      lustreType === 'PERSISTENT_1'
        ? LUSTRE_PERSISTENT1_DEFAULT_THROUGHPUT
        : LUSTRE_PERSISTENT2_DEFAULT_THROUGHPUT,
    )
  } else {
    clearState(storageThroughputPath)
  }
}

export function FsxLustreSettings({index}: any) {
  const {t} = useTranslation()
  const isLustrePersistent2Active = useFeatureFlag('lustre_persistent2')
  const isDeletionPolicyEnabled = useFeatureFlag('lustre_deletion_policy')
  const useExisting =
    useState(['app', 'wizard', 'storage', 'ui', index, 'useExisting']) || false

  const fsxPath = useMemo(
    () => [...storagePath, index, 'FsxLustreSettings'],
    [index],
  )
  const storageCapacityPath = [...fsxPath, 'StorageCapacity']
  const lustreTypePath = [...fsxPath, 'DeploymentType']
  // support FSx Lustre PERSISTENT_2 only in >= 3.2.0
  const lustreTypes = [
    isLustrePersistent2Active ? 'PERSISTENT_2' : null,
    'PERSISTENT_1',
    'SCRATCH_1',
    'SCRATCH_2',
  ].filter(Boolean)
  const storageThroughputPath = [...fsxPath, 'PerUnitStorageThroughput']
  const importPathPath = [...fsxPath, 'ImportPath']
  const exportPathPath = [...fsxPath, 'ExportPath']
  const compressionPath = [...fsxPath, 'DataCompressionType']
  const deletionPolicyPath = [...fsxPath, 'DeletionPolicy']

  const storageCapacity = useState(storageCapacityPath)
  const lustreType = useState(lustreTypePath)
  const storageThroughput = useState(storageThroughputPath)
  const importPath = useState(importPathPath) || ''
  const exportPath = useState(exportPathPath) || ''
  const compression = useState(compressionPath)
  const deletionPolicy = useState(deletionPolicyPath)

  const supportedDeletionPolicies: FsxLustreDeletionPolicy[] = [
    'Delete',
    'Retain',
  ]

  React.useEffect(() => {
    const fsxPath = [...storagePath, index, 'FsxLustreSettings']
    const storageCapacityPath = [...fsxPath, 'StorageCapacity']
    const lustreTypePath = [...fsxPath, 'DeploymentType']
    const deletionPolicyPath = [...fsxPath, 'DeletionPolicy']
    const storageThroughputPath = [...fsxPath, 'PerUnitStorageThroughput']
    if (isDeletionPolicyEnabled && deletionPolicy === null)
      setState(deletionPolicyPath, DEFAULT_DELETION_POLICY)
    if (storageCapacity === null && !useExisting)
      setState(storageCapacityPath, 1200)
    if (!storageThroughput && !useExisting) {
      setDefaultStorageThroughput(lustreType, storageThroughputPath)
    }
    if (lustreType === null && !useExisting)
      setState(
        lustreTypePath,
        isLustrePersistent2Active ? 'PERSISTENT_2' : 'PERSISTENT_1',
      )
  }, [
    storageCapacity,
    lustreType,
    storageThroughput,
    index,
    useExisting,
    isLustrePersistent2Active,
    deletionPolicy,
    isDeletionPolicyEnabled,
  ])

  const toggleCompression = () => {
    if (compression) clearState(compressionPath)
    else setState(compressionPath, 'LZ4')
  }

  const setImportPath = (path: any) => {
    if (path !== '') setState(importPathPath, path)
    else clearState(importPathPath)
  }

  const setExportPath = (path: any) => {
    if (path !== '') setState(exportPathPath, path)
    else clearState(exportPathPath)
  }

  const capacityMin = 1200
  const capacityMax = 100800
  const capacityStep = 1200

  const clampCapacity = (inCapacityStr: string) => {
    return clamp(
      parseInt(inCapacityStr),
      capacityMin,
      capacityMax,
      capacityStep,
    ).toString()
  }

  const onDeletionPolicyChange = useCallback(
    (selectedDeletionPolicy: DeletionPolicy) => {
      const deletionPolicyPath = [...fsxPath, 'DeletionPolicy']
      setState(deletionPolicyPath, selectedDeletionPolicy)
    },
    [fsxPath],
  )

  const throughputFooterLinks = useMemo(
    () => [
      {
        title: t('wizard.storage.Fsx.throughput.link.title'),
        href: t('wizard.storage.Fsx.throughput.link.href'),
      },
    ],
    [t],
  )

  const lustreTypeFooterLinks = useMemo(
    () => [
      {
        title: t('wizard.storage.Fsx.lustreType.link.title'),
        href: t('wizard.storage.Fsx.lustreType.link.href'),
      },
    ],
    [t],
  )

  const lustreCompressionFooterLinks = useMemo(
    () => [
      {
        title: t('wizard.storage.Fsx.compression.link.title'),
        href: t('wizard.storage.Fsx.compression.link.href'),
      },
    ],
    [t],
  )

  return (
    <SpaceBetween direction="vertical" size="m">
      <ColumnLayout columns={2}>
        <FormField
          label={
            <Trans
              i18nKey="wizard.storage.Fsx.lustreType.label"
              values={{storageCapacity: storageCapacity}}
            />
          }
          info={
            <InfoLink
              helpPanel={
                <TitleDescriptionHelpPanel
                  title={t('wizard.storage.Fsx.lustreType.label')}
                  description={
                    <Trans i18nKey="wizard.storage.Fsx.lustreType.help" />
                  }
                  footerLinks={lustreTypeFooterLinks}
                />
              }
            />
          }
        >
          <Select
            selectedOption={strToOption(lustreType || 'PERSISTENT_1')}
            onChange={({detail}) => {
              setState(lustreTypePath, detail.selectedOption.value)
              setDefaultStorageThroughput(
                detail.selectedOption.value!,
                storageThroughputPath,
              )
            }}
            options={lustreTypes.map(strToOption)}
          />
        </FormField>
      </ColumnLayout>
      <ColumnLayout columns={2}>
        <FormField label={t('wizard.storage.Fsx.capacity.label')}>
          <Input
            value={storageCapacity}
            placeholder={t('wizard.storage.Fsx.capacity.placeholder')}
            step={1200}
            onChange={({detail}) => {
              setState(storageCapacityPath, detail.value)
            }}
            onBlur={_e => {
              setState(storageCapacityPath, clampCapacity(storageCapacity))
            }}
            type="number"
          />
        </FormField>
      </ColumnLayout>
      {lustreType === 'PERSISTENT_1' && (
        <>
          <ColumnLayout columns={2}>
            <FormField
              label={t('wizard.storage.Fsx.import.label')}
              info={
                <InfoLink
                  helpPanel={
                    <TitleDescriptionHelpPanel
                      title={t('wizard.storage.Fsx.import.label')}
                      description={
                        <Trans i18nKey="wizard.storage.Fsx.import.help">
                          <a
                            rel="noreferrer"
                            target="_blank"
                            href="https://docs.aws.amazon.com/parallelcluster/latest/ug/SharedStorage-v3.html#yaml-SharedStorage-FsxLustreSettings-ImportPath"
                          ></a>
                        </Trans>
                      }
                    />
                  }
                />
              }
            >
              <Input
                placeholder={t('wizard.storage.Fsx.import.placeholder')}
                value={importPath}
                onChange={({detail}) => setImportPath(detail.value)}
              />
            </FormField>
          </ColumnLayout>
          <ColumnLayout columns={2}>
            <FormField
              label={t('wizard.storage.Fsx.export.label')}
              info={
                <InfoLink
                  helpPanel={
                    <TitleDescriptionHelpPanel
                      title={t('wizard.storage.Fsx.export.label')}
                      description={
                        <Trans i18nKey="wizard.storage.Fsx.export.help">
                          <a
                            rel="noreferrer"
                            target="_blank"
                            href="https://docs.aws.amazon.com/parallelcluster/latest/ug/SharedStorage-v3.html#yaml-SharedStorage-FsxLustreSettings-ExportPath"
                          ></a>
                        </Trans>
                      }
                    />
                  }
                />
              }
            >
              <Input
                placeholder={t('wizard.storage.Fsx.export.placeholder')}
                value={exportPath}
                onChange={({detail}) => {
                  setExportPath(detail.value)
                }}
              />
            </FormField>
          </ColumnLayout>
        </>
      )}

      {isPersistentFsx(lustreType) && (
        <ColumnLayout columns={2}>
          <FormField
            label={t('wizard.storage.Fsx.throughput.label')}
            info={
              <InfoLink
                helpPanel={
                  <TitleDescriptionHelpPanel
                    title={t('wizard.storage.Fsx.throughput.label')}
                    description={t('wizard.storage.Fsx.throughput.help')}
                    footerLinks={throughputFooterLinks}
                  />
                }
              />
            }
          >
            <Select
              selectedOption={strToOption(storageThroughput || '')}
              onChange={({detail}) => {
                setState(storageThroughputPath, detail.selectedOption.value)
              }}
              options={
                lustreType == 'PERSISTENT_1'
                  ? storageThroughputsP1.map(strToOption)
                  : storageThroughputsP2.map(strToOption)
              }
            />
          </FormField>
        </ColumnLayout>
      )}
      <SpaceBetween direction="horizontal" size="xs">
        <Checkbox checked={compression !== null} onChange={toggleCompression}>
          <Trans i18nKey="wizard.storage.Fsx.compression.label" />
        </Checkbox>
        <InfoLink
          helpPanel={
            <TitleDescriptionHelpPanel
              title={t('wizard.storage.Fsx.compression.label')}
              description={t('wizard.storage.Fsx.compression.help')}
              footerLinks={lustreCompressionFooterLinks}
            />
          }
        />
      </SpaceBetween>
      {isDeletionPolicyEnabled && (
        <ColumnLayout columns={2}>
          <DeletionPolicyFormField
            options={supportedDeletionPolicies}
            value={deletionPolicy}
            onDeletionPolicyChange={onDeletionPolicyChange}
          />
        </ColumnLayout>
      )}
    </SpaceBetween>
  )
}

export function EfsSettings({index}: any) {
  const efsPath = useMemo(() => [...storagePath, index, 'EfsSettings'], [index])
  const encryptedPath = [...efsPath, 'Encrypted']
  const kmsPath = [...efsPath, 'KmsKeyId']
  const performancePath = [...efsPath, 'PerformanceMode']
  const performanceModes = ['generalPurpose', 'maxIO']
  const deletionPolicyPath = [...efsPath, 'DeletionPolicy']
  const {t} = useTranslation()

  const throughputModePath = [...efsPath, 'ThroughputMode']
  const provisionedThroughputPath = [...efsPath, 'ProvisionedThroughput']

  let encrypted = useState(encryptedPath)
  let kmsId = useState(kmsPath)
  let performanceMode = useState(performancePath) || 'generalPurpose'
  let throughputMode = useState(throughputModePath)
  let provisionedThroughput = useState(provisionedThroughputPath)
  const deletionPolicy = useState(deletionPolicyPath)

  const isDeletionPolicyEnabled = useFeatureFlag('efs_deletion_policy')
  const supportedDeletionPolicies: EfsDeletionPolicy[] = ['Delete', 'Retain']

  const provisionedThroughputErrors = useState([
    ...errorsPath,
    index,
    'EfsSettings',
    'ProvisionedThroughput',
  ])

  React.useEffect(() => {
    const efsPath = [...storagePath, index, 'EfsSettings']
    const throughputModePath = [...efsPath, 'ThroughputMode']
    const provisionedThroughputPath = [...efsPath, 'ProvisionedThroughput']
    const deletionPolicyPath = [...efsPath, 'DeletionPolicy']
    if (throughputMode === null) setState(throughputModePath, 'bursting')
    else if (throughputMode === 'bursting')
      clearState([provisionedThroughputPath])
    if (isDeletionPolicyEnabled && deletionPolicy === null)
      setState(deletionPolicyPath, DEFAULT_DELETION_POLICY)
  }, [deletionPolicy, index, isDeletionPolicyEnabled, throughputMode])

  const toggleEncrypted = () => {
    const setEncrypted = !encrypted
    setState(encryptedPath, setEncrypted)
    if (!setEncrypted) clearState(kmsPath)
  }

  const encryptionFooterLinks = useMemo(
    () => [
      {
        title: t('wizard.storage.Efs.encrypted.encryptionLink.title'),
        href: t('wizard.storage.Efs.encrypted.encryptionLink.href'),
      },
    ],
    [t],
  )

  const provisionedFooterLinks = useMemo(
    () => [
      {
        title: t('wizard.storage.Efs.provisioned.throughputLink.title'),
        href: t('wizard.storage.Efs.provisioned.throughputLink.href'),
      },
    ],
    [t],
  )

  const onDeletionPolicyChange = useCallback(
    (selectedDeletionPolicy: DeletionPolicy) => {
      const deletionPolicyPath = [...efsPath, 'DeletionPolicy']
      setState(deletionPolicyPath, selectedDeletionPolicy)
    },
    [efsPath],
  )

  return (
    <SpaceBetween direction="vertical" size="m">
      <ColumnLayout columns={2}>
        <SpaceBetween direction="vertical" size="xxs">
          <CheckboxWithHelpPanel
            checked={encrypted}
            onChange={toggleEncrypted}
            helpPanel={
              <TitleDescriptionHelpPanel
                title={t('wizard.storage.Efs.encrypted.label')}
                description={t('wizard.storage.Efs.encrypted.help')}
                footerLinks={encryptionFooterLinks}
              />
            }
          >
            {t('wizard.storage.Efs.encrypted.label')}
          </CheckboxWithHelpPanel>
          {encrypted ? (
            <Input
              value={kmsId}
              placeholder={t('wizard.storage.Efs.encrypted.kmsId')}
              onChange={({detail}) => {
                setState(kmsPath, detail.value)
              }}
            />
          ) : null}
        </SpaceBetween>
      </ColumnLayout>
      <ColumnLayout columns={2}>
        <FormField label={t('wizard.storage.Efs.performanceMode.label')}>
          <Select
            selectedOption={strToOption(performanceMode)}
            onChange={({detail}) => {
              setState(performancePath, detail.selectedOption.value)
            }}
            options={performanceModes.map(strToOption)}
          />
        </FormField>
      </ColumnLayout>
      <ColumnLayout columns={2}>
        <SpaceBetween direction="vertical" size="xxs">
          <CheckboxWithHelpPanel
            helpPanel={
              <TitleDescriptionHelpPanel
                title={t('wizard.storage.Efs.provisioned.label')}
                description={t('wizard.storage.Efs.provisioned.help')}
                footerLinks={provisionedFooterLinks}
              />
            }
            checked={throughputMode !== 'bursting'}
            onChange={_event => {
              const newThroughputMode =
                throughputMode === 'bursting' ? 'provisioned' : 'bursting'
              setState(throughputModePath, newThroughputMode)
              newThroughputMode === 'provisioned'
                ? setState(provisionedThroughputPath, 128)
                : clearState(provisionedThroughputPath)
            }}
          >
            {t('wizard.storage.Efs.provisioned.label')}
          </CheckboxWithHelpPanel>
          {throughputMode === 'provisioned' && (
            <FormField errorText={provisionedThroughputErrors}>
              <Input
                type="number"
                placeholder={t('wizard.storage.Efs.provisioned.placeholder')}
                value={clamp(
                  parseInt(provisionedThroughput),
                  1,
                  1024,
                ).toString()}
                onChange={({detail}) => {
                  setState(
                    provisionedThroughputPath,
                    clamp(parseInt(detail.value), 1, 1024),
                  )
                }}
              />
            </FormField>
          )}
        </SpaceBetween>
      </ColumnLayout>
      {isDeletionPolicyEnabled && (
        <ColumnLayout columns={2}>
          <DeletionPolicyFormField
            options={supportedDeletionPolicies}
            value={deletionPolicy}
            onDeletionPolicyChange={onDeletionPolicyChange}
          />
        </ColumnLayout>
      )}
    </SpaceBetween>
  )
}

export function EbsSettings({index}: any) {
  const {t} = useTranslation()
  const isDeletionPolicyEnabled = useFeatureFlag('ebs_deletion_policy')

  const ebsPath = useMemo(() => [...storagePath, index, 'EbsSettings'], [index])
  const volumeTypePath = [...ebsPath, 'VolumeType']
  const volumeTypes = ['gp3', 'gp2', 'io1', 'io2', 'sc1', 'st1', 'standard']
  const defaultVolumeType = 'gp3'
  const volumeSizePath = [...ebsPath, 'Size']
  const encryptedPath = [...ebsPath, 'Encrypted']
  const kmsPath = [...ebsPath, 'KmsKeyId']
  const snapshotIdPath = useMemo(() => [...ebsPath, 'SnapshotId'], [ebsPath])

  const deletionPolicyPath = [...ebsPath, 'DeletionPolicy']
  const supportedDeletionPolicies: EbsDeletionPolicy[] = [
    'Delete',
    'Retain',
    'Snapshot',
  ]

  const volumeErrors = useState([...errorsPath, index, 'EbsSettings', 'Size'])

  let volumeType = useState(volumeTypePath)
  let volumeSize = useState(volumeSizePath)
  let encrypted = useState(encryptedPath)
  let kmsId = useState(kmsPath)
  let snapshotId = useState(snapshotIdPath)
  const [snapshostVisible, setSnapshotVisible] = reactUseState(!!snapshotId)
  let deletionPolicy = useState(deletionPolicyPath)

  let validated = useState([...errorsPath, 'validated'])

  React.useEffect(() => {
    const volumeTypePath = [...ebsPath, 'VolumeType']
    const deletionPolicyPath = [...ebsPath, 'DeletionPolicy']
    const volumeSizePath = [...ebsPath, 'Size']
    if (volumeType === null) setState(volumeTypePath, defaultVolumeType)
    if (isDeletionPolicyEnabled && deletionPolicy === null)
      setState(deletionPolicyPath, DEFAULT_DELETION_POLICY)
    if (volumeSize === null) setState(volumeSizePath, 35)
  }, [volumeType, volumeSize, deletionPolicy, isDeletionPolicyEnabled, ebsPath])

  const toggleEncrypted = () => {
    const setEncrypted = !encrypted
    setState(encryptedPath, setEncrypted)
    if (!setEncrypted) clearState(kmsPath)
  }

  const toggleSnapshotVisibility = useCallback(() => {
    clearState(snapshotIdPath)
    setSnapshotVisible(!snapshostVisible)
  }, [setSnapshotVisible, snapshostVisible, snapshotIdPath])

  const encryptionFooterLinks = useMemo(
    () => [
      {
        title: t('wizard.storage.Ebs.encrypted.encryptionLink.title'),
        href: t('wizard.storage.Ebs.encrypted.encryptionLink.href'),
      },
    ],
    [t],
  )

  const snapshotFooterLinks = useMemo(
    () => [
      {
        title: t('wizard.storage.Ebs.snapshotId.snapshotLink.title'),
        href: t('wizard.storage.Ebs.snapshotId.snapshotLink.href'),
      },
    ],
    [t],
  )
  const onDeletionPolicyChange = useCallback(
    (selectedDeletionPolicy: DeletionPolicy) => {
      const deletionPolicyPath = [...ebsPath, 'DeletionPolicy']
      setState(deletionPolicyPath, selectedDeletionPolicy)
    },
    [ebsPath],
  )

  return (
    <SpaceBetween direction="vertical" size="m">
      <ColumnLayout columns={2}>
        <FormField label={t('wizard.storage.Ebs.volumeType.label')}>
          <Select
            placeholder={t('wizard.queues.validation.scriptWithArgs', {
              defaultVlumeType: defaultVolumeType,
            })}
            selectedOption={volumeType && strToOption(volumeType)}
            onChange={({detail}) => {
              setState(volumeTypePath, detail.selectedOption.value)
            }}
            options={volumeTypes.map(strToOption)}
          />
        </FormField>
      </ColumnLayout>
      <ColumnLayout columns={2}>
        <FormField
          label={t('wizard.storage.Ebs.volumeSize.label')}
          errorText={volumeErrors}
        >
          <Input
            inputMode={'decimal'}
            placeholder={t('wizard.storage.Ebs.volumeSize.placeholder')}
            type={'number' as InputProps.Type}
            value={volumeSize}
            onChange={({detail}) => {
              setState(volumeSizePath, detail.value)
              validated && storageValidate()
            }}
          />
        </FormField>
      </ColumnLayout>
      <ColumnLayout columns={2}>
        <SpaceBetween direction="vertical" size="xxs">
          <CheckboxWithHelpPanel
            checked={encrypted}
            onChange={toggleEncrypted}
            helpPanel={
              <TitleDescriptionHelpPanel
                title={t('wizard.storage.Ebs.encrypted.label')}
                description={t('wizard.storage.Ebs.encrypted.help')}
                footerLinks={encryptionFooterLinks}
              />
            }
          >
            {t('wizard.storage.Ebs.encrypted.label')}
          </CheckboxWithHelpPanel>

          {encrypted ? (
            <Input
              placeholder={t('wizard.storage.Ebs.encrypted.kmsId')}
              value={kmsId}
              onChange={({detail}) => {
                setState(kmsPath, detail.value)
              }}
            />
          ) : null}
        </SpaceBetween>
      </ColumnLayout>
      <ColumnLayout columns={2}>
        <SpaceBetween direction="vertical" size="xxs">
          <CheckboxWithHelpPanel
            checked={snapshostVisible}
            onChange={toggleSnapshotVisibility}
            helpPanel={
              <TitleDescriptionHelpPanel
                title={t('wizard.storage.Ebs.snapshotId.label')}
                description={t('wizard.storage.Ebs.snapshotId.help')}
                footerLinks={snapshotFooterLinks}
              />
            }
          >
            {t('wizard.storage.Ebs.snapshotId.label')}
          </CheckboxWithHelpPanel>
          {snapshostVisible && (
            <Input
              value={snapshotId}
              placeholder={t('wizard.storage.Ebs.snapshotId.placeholder')}
              onChange={({detail}) => {
                setState(snapshotIdPath, detail.value)
              }}
            />
          )}
        </SpaceBetween>
      </ColumnLayout>
      {isDeletionPolicyEnabled && (
        <ColumnLayout columns={2}>
          <DeletionPolicyFormField
            options={supportedDeletionPolicies}
            value={deletionPolicy}
            onDeletionPolicyChange={onDeletionPolicyChange}
          />
        </ColumnLayout>
      )}
    </SpaceBetween>
  )
}

function StorageInstance({index}: any) {
  const path = [...storagePath, index]
  const uiSettingsForStorage = ['app', 'wizard', 'storage', 'ui', index]
  const storageType: StorageType = useState([...path, 'StorageType'])
  const storageName = useState([...path, 'Name']) || ''
  const storageNameErrors = useState([...errorsPath, index, 'Name'])
  const mountPoint = useState([...path, 'MountDir'])
  const settingsPath = [...path, `${storageType}Settings`]
  const errorsInstancePath = [...errorsPath, index, `${storageType}Settings`]

  const useExisting =
    useState([...uiSettingsForStorage, 'useExisting']) ||
    !(STORAGE_TYPE_PROPS[storageType].maxToCreate > 0)
  //TODO Add idType as an attribute within STORAGE_TYPE_PROPS to avoid nested ternary operations.
  const existingPath = STORAGE_TYPE_PROPS[storageType].mountFilesystem
    ? [...settingsPath, 'FileSystemId']
    : storageType == 'FileCache'
    ? [...settingsPath, 'FileCacheId']
    : [...settingsPath, 'VolumeId']
  //TODO Add idType as an attribute within STORAGE_TYPE_PROPS to avoid nested ternary operations.
  const existingPathError = useState(
    STORAGE_TYPE_PROPS[storageType].mountFilesystem
      ? [...errorsInstancePath, 'FileSystemId']
      : storageType == 'FileCache'
      ? [...errorsInstancePath, 'FileCacheId']
      : [...errorsInstancePath, 'VolumeId'],
  )
  const existingId = useState(existingPath) || ''

  const storages = useState(storagePath)
  const uiSettings = useState(['app', 'wizard', 'storage', 'ui'])
  const {t} = useTranslation()

  const fsxFilesystems = useState(['aws', 'fsxFilesystems'])
  const fileCaches = useState(['aws', 'fileCaches'])
  const fsxVolumes = useState(['aws', 'fsxVolumes'])
  const efsFilesystems = useState(['aws', 'efs_filesystems']) || []

  const canEditFilesystems = useDynamicStorage()

  const canToggle =
    (useExisting && canCreateStorage(storageType, storages, uiSettings)) ||
    (!useExisting &&
      canAttachExistingStorage(storageType, storages, uiSettings))

  const removeStorage = () => {
    if (index === 0 && storages.length === 1) {
      clearState(['app', 'wizard', 'storage', 'ui'])
      clearState(storagePath)
    } else {
      clearState(uiSettingsForStorage)
      clearState(path)
    }

    // Rename storages to keep indices correct and names unique
    const updatedStorages = getState(storagePath)
    if (updatedStorages)
      for (let i = 0; i < updatedStorages.length; i++) {
        const storage = getState([...storagePath, i])
        setState([...storagePath, i, 'Name'], `${storage.StorageType}${i}`)
      }
  }

  const toggleUseExisting = () => {
    const value = !useExisting
    clearState(settingsPath)
    setState([...uiSettingsForStorage, 'useExisting'], value)
  }

  const idToOption = (id: any) => {
    return {label: id, value: id}
  }

  const updateStorageName = useCallback<
    NonCancelableEventHandler<BaseChangeDetail>
  >(
    ({detail}) => {
      setState([...storagePath, index, 'Name'], detail.value)
    },
    [index],
  )

  const useExistingFooterLinks = useMemo(
    () => [
      {
        title: t('wizard.storage.instance.useExisting.fsxLink.title'),
        href: t('wizard.storage.instance.useExisting.fsxLink.href'),
      },
      {
        title: t('wizard.storage.instance.useExisting.efsLink.title'),
        href: t('wizard.storage.instance.useExisting.efsLink.href'),
      },
      {
        title: t('wizard.storage.instance.useExisting.ebsLink.title'),
        href: t('wizard.storage.instance.useExisting.ebsLink.href'),
      },
    ],
    [t],
  )

  const storageTypeDisplay = ALL_STORAGES.find(
    ([type]) => type === storageType,
  )?.[1]

  return (
    <Container
      header={
        <Header
          variant="h3"
          actions={
            <Button disabled={!canEditFilesystems} onClick={removeStorage}>
              {t('wizard.storage.container.removeStorage')}
            </Button>
          }
        >
          {t('wizard.storage.container.sourceTitle', {
            index: index + 1,
            name: storageTypeDisplay,
          })}
        </Header>
      }
    >
      <SpaceBetween direction="vertical" size="m">
        <ColumnLayout columns={2}>
          <FormField
            label={t('wizard.storage.instance.sourceName.label')}
            errorText={storageNameErrors}
          >
            <Input
              value={storageName}
              onChange={updateStorageName}
              placeholder={t('wizard.storage.instance.sourceName.placeholder')}
            />
          </FormField>
        </ColumnLayout>
        <ColumnLayout columns={2}>
          <FormField
            label={t('wizard.storage.instance.mountPoint.label')}
            info={
              <InfoLink
                helpPanel={
                  <TitleDescriptionHelpPanel
                    title={t('wizard.storage.instance.mountPoint.label')}
                    description={t('wizard.storage.instance.mountPoint.help')}
                  />
                }
              />
            }
          >
            <Input
              value={mountPoint}
              placeholder={t('wizard.storage.instance.mountPoint.placeholder')}
              onChange={({detail}) => {
                setState([...storagePath, index, 'MountDir'], detail.value)
              }}
            />
          </FormField>
        </ColumnLayout>
        <ColumnLayout columns={2}>
          <SpaceBetween direction="vertical" size="xxs">
            {STORAGE_TYPE_PROPS[storageType].maxToCreate > 0 ? (
              <SpaceBetween direction="horizontal" size="s">
                <Checkbox
                  disabled={!canToggle}
                  checked={useExisting}
                  onChange={toggleUseExisting}
                >
                  <Trans i18nKey="wizard.storage.instance.useExisting.label" />
                </Checkbox>
                <InfoLink
                  helpPanel={
                    <TitleDescriptionHelpPanel
                      title={t('wizard.storage.instance.useExisting.label')}
                      description={t(
                        'wizard.storage.instance.useExisting.help',
                      )}
                      footerLinks={useExistingFooterLinks}
                    />
                  }
                />
              </SpaceBetween>
            ) : null}
            {useExisting &&
              {
                Ebs: (
                  <FormField
                    label={t('wizard.storage.Ebs.existing')}
                    errorText={existingPathError}
                  >
                    <Input
                      placeholder={t(
                        'wizard.storage.instance.useExisting.placeholder',
                      )}
                      value={existingId}
                      onChange={({detail}) => {
                        setState(existingPath, detail.value)
                      }}
                    />
                  </FormField>
                ),
                FsxLustre: (
                  <FormField
                    label={t('wizard.storage.Fsx.existing.fsxLustre')}
                    errorText={existingPathError}
                  >
                    <Select
                      placeholder={t(
                        'wizard.storage.container.volumePlaceholder',
                      )}
                      selectedOption={existingId && idToOption(existingId)}
                      onChange={({detail}) => {
                        setState(existingPath, detail.selectedOption.value)
                      }}
                      options={fsxFilesystems.lustre.map((fs: any) => ({
                        value: fs.id,
                        label: fs.displayName,
                      }))}
                      empty={t('wizard.storage.instance.useExisting.empty')}
                    />
                  </FormField>
                ),
                FsxOpenZfs: (
                  <FormField
                    label={t('wizard.storage.Fsx.existing.fsxOpenZfs')}
                    errorText={existingPathError}
                  >
                    <Select
                      placeholder={t(
                        'wizard.storage.container.volumePlaceholder',
                      )}
                      selectedOption={existingId && idToOption(existingId)}
                      onChange={({detail}) => {
                        setState(existingPath, detail.selectedOption.value)
                      }}
                      options={fsxVolumes.zfs.map((vol: any) => ({
                        value: vol.id,
                        label: vol.displayName,
                      }))}
                      empty={t('wizard.storage.instance.useExisting.empty')}
                    />
                  </FormField>
                ),
                FsxOntap: (
                  <FormField
                    label={t('wizard.storage.Fsx.existing.fsxOnTap')}
                    errorText={existingPathError}
                  >
                    <Select
                      placeholder={t(
                        'wizard.storage.container.volumePlaceholder',
                      )}
                      selectedOption={existingId && idToOption(existingId)}
                      onChange={({detail}) => {
                        setState(existingPath, detail.selectedOption.value)
                      }}
                      options={fsxVolumes.ontap.map((vol: any) => ({
                        value: vol.id,
                        label: vol.displayName,
                      }))}
                      empty={t('wizard.storage.instance.useExisting.empty')}
                    />
                  </FormField>
                ),
                FileCache: (
                  <FormField
                    label={t('wizard.storage.Fsx.existing.fileCache')}
                    errorText={existingPathError}
                  >
                    <Select
                      placeholder={t(
                        'wizard.storage.container.cachePlaceholder',
                      )}
                      selectedOption={existingId && idToOption(existingId)}
                      onChange={({detail}) => {
                        setState(existingPath, detail.selectedOption.value)
                      }}
                      options={fileCaches.lustre.map((x: any) => {
                        return {
                          value: x.id,
                          label: x.id + (x.Name ? ` (${x.Name})` : ''),
                        }
                      })}
                      empty={t('wizard.storage.instance.useExisting.empty')}
                    />
                  </FormField>
                ),
                Efs: (
                  <FormField
                    label="EFS Filesystem"
                    errorText={existingPathError}
                  >
                    <Select
                      placeholder={t(
                        'wizard.storage.container.volumePlaceholder',
                      )}
                      selectedOption={existingId && idToOption(existingId)}
                      onChange={({detail}) => {
                        setState(existingPath, detail.selectedOption.value)
                      }}
                      options={efsFilesystems.map((x: any) => {
                        return {
                          value: x.FileSystemId,
                          label:
                            x.FileSystemId + (x.Name ? ` (${x.Name})` : ''),
                        }
                      })}
                      empty={t('wizard.storage.instance.useExisting.empty')}
                    />
                  </FormField>
                ),
              }[storageType]}
          </SpaceBetween>
        </ColumnLayout>
        {!useExisting &&
          {
            FsxLustre: <FsxLustreSettings index={index} />,
            Efs: <EfsSettings index={index} />,
            Ebs: <EbsSettings index={index} />,
            FsxOntap: null,
            FsxOpenZfs: null,
            FileCache: null,
          }[storageType]}
      </SpaceBetween>
    </Container>
  )
}

const ALL_STORAGES: StorageTypeOption[] = [
  ['FsxLustre', 'Amazon FSx for Lustre (FSX)'],
  ['FsxOntap', 'Amazon FSx for NetApp ONTAP (FSX)'],
  ['FsxOpenZfs', 'Amazon FSx for OpenZFS (FSX)'],
  ['FileCache', 'Amazon File Cache'],
  ['Efs', 'Amazon Elastic File System (EFS)'],
  ['Ebs', 'Amazon Elastic Block Store (EBS)'],
]

function Storage() {
  const {t} = useTranslation()
  const storages = useState(storagePath)
  const uiStorageSettings = useState(['app', 'wizard', 'storage', 'ui'])
  const isFsxOnTapActive = useFeatureFlag('fsx_ontap')
  const isFsxOpenZsfActive = useFeatureFlag('fsx_openzsf')
  const isFileCacheActive = useFeatureFlag('amazon_file_cache')
  const canEditFilesystems = useDynamicStorage()

  const hasAddedStorage = storages?.length > 0

  useHelpPanel(<StorageHelpPanel />)

  const storageMaxes: Record<string, number> = {
    FsxLustre: 21,
    FsxOntap: 20,
    FsxOpenZfs: 20,
    FileCache: 20,
    Efs: 21,
    Ebs: 5,
  }

  const supportedStorages = ALL_STORAGES.filter(([storageType]) => {
    if (storageType === 'FsxOntap' && !isFsxOnTapActive) {
      return false
    }
    if (storageType === 'FsxOpenZfs' && !isFsxOpenZsfActive) {
      return false
    }
    if (storageType === 'FileCache' && !isFileCacheActive) {
      return false
    }
    return true
  })

  const defaultCounts = {FsxLustre: 0, Efs: 0, Ebs: 0}

  const storageReducer = (eax: any, item: any) => {
    let ret = {...eax}
    ret[item.StorageType] += 1
    return ret
  }
  const storageCounts = storages
    ? storages.reduce(storageReducer, defaultCounts)
    : defaultCounts

  const storageTypes = supportedStorages.reduce(
    (newStorages: StorageTypeOption[], storageType: StorageTypeOption) => {
      const st = storageType[0]
      return storageCounts[st] >= storageMaxes[st]
        ? newStorages
        : [...newStorages, storageType]
    },
    [],
  )

  const onAddStorageSubmit = React.useCallback(
    (selectedStorageTypes: StorageType[]) => {
      const existingStorages = storages || []
      const existingUiStorageSettings = uiStorageSettings || []
      const [storageEntries, uiSettingsEntries] = buildStorageEntries(
        existingStorages,
        existingUiStorageSettings,
        selectedStorageTypes,
      )

      setState(storagePath, [...existingStorages, ...storageEntries])
      setState(uiSettingsPath, [
        ...existingUiStorageSettings,
        ...uiSettingsEntries,
      ])
    },
    [storages, uiStorageSettings],
  )

  return (
    <SpaceBetween direction="vertical" size="l">
      <Container
        header={
          <Header
            description={
              <Trans i18nKey="wizard.storage.container.description">
                <Link
                  variant="primary"
                  external
                  externalIconAriaLabel={t('global.openNewTab')}
                  href="https://docs.aws.amazon.com/parallelcluster/latest/ug/shared-storage-quotas-v3.html"
                />
              </Trans>
            }
          >
            {t('wizard.storage.container.title')}
          </Header>
        }
      >
        <SpaceBetween direction="vertical" size="m">
          {!hasAddedStorage && (
            <Alert statusIconAriaLabel="Info">
              {t('wizard.storage.container.noStorageSelected')}
            </Alert>
          )}
          {canEditFilesystems && storageTypes.length > 0 && (
            <AddStorageForm
              storageTypes={storageTypes}
              onSubmit={onAddStorageSubmit}
            />
          )}
        </SpaceBetween>
      </Container>
      {hasAddedStorage
        ? storages.map((_: any, i: any) => (
            <StorageInstance key={i} index={i} />
          ))
        : null}
    </SpaceBetween>
  )
}

const StorageHelpPanel = () => {
  const {t} = useTranslation()
  const footerLinks = useMemo(
    () => [
      {
        title: t('wizard.storage.helpPanel.link.sharedStorage.title'),
        href: t('wizard.storage.helpPanel.link.sharedStorage.href'),
      },
      {
        title: t('wizard.storage.helpPanel.link.sharedStorageSection.title'),
        href: t('wizard.storage.helpPanel.link.sharedStorageSection.href'),
      },
    ],
    [t],
  )
  return (
    <TitleDescriptionHelpPanel
      title={<Trans i18nKey="wizard.storage.helpPanel.title" />}
      description={
        <>
          <Trans i18nKey="wizard.storage.helpPanel.description" />
          <Trans i18nKey="wizard.storage.helpPanel.section.external.title" />
          <Trans i18nKey="wizard.storage.helpPanel.section.external.description" />
          <Trans i18nKey="wizard.storage.helpPanel.section.managed.title" />
          <Trans i18nKey="wizard.storage.helpPanel.section.managed.description">
            <ul>
              <li>
                <Trans i18nKey="wizard.storage.helpPanel.section.managed.list.delete" />
              </li>
              <li>
                <Trans i18nKey="wizard.storage.helpPanel.section.managed.list.remove" />
              </li>
              <li>
                <Trans i18nKey="wizard.storage.helpPanel.section.managed.list.edit" />
              </li>
            </ul>
          </Trans>
          <Trans i18nKey="wizard.storage.helpPanel.section.recommendation.description" />
        </>
      }
      footerLinks={footerLinks}
    />
  )
}

function canCreateStorage(
  storageType: StorageType,
  storages: Storages,
  uiStorageSettings: UIStorageSettings,
) {
  if (!storageType) {
    return false
  }

  if (!storages || !uiStorageSettings) {
    return true
  }

  const maxToCreate = STORAGE_TYPE_PROPS[storageType].maxToCreate
  const alreadyCreated = storages
    .filter((_, index) => !uiStorageSettings[index].useExisting)
    .filter(storage => storage.StorageType === storageType).length

  return alreadyCreated < maxToCreate
}

function canAttachExistingStorage(
  storageType: StorageType,
  storages: Storages,
  uiStorageSettings: UIStorageSettings,
) {
  if (!storageType) {
    return false
  }

  if (!storages || !uiStorageSettings) {
    return true
  }

  const maxExistingToAttach =
    STORAGE_TYPE_PROPS[storageType].maxExistingToAttach
  const existingAlreadyAttached = storages
    .filter((_, index) => uiStorageSettings[index].useExisting)
    .filter(storage => storage.StorageType === storageType).length

  return existingAlreadyAttached < maxExistingToAttach
}

function useDynamicStorage() {
  const editingCluster = useState(['app', 'wizard', 'editing'])
  const isDynamicFSMountActive = useFeatureFlag('dynamic_fs_mount')
  return isDynamicFSMountActive || !editingCluster
}

export {
  Storage,
  storageValidate,
  canCreateStorage,
  canAttachExistingStorage,
  useDynamicStorage,
  StorageHelpPanel,
}
