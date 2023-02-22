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
import React, {useCallback} from 'react'
import i18next from 'i18next'
import {Trans, useTranslation} from 'react-i18next'
import {findFirst, clamp} from '../../util'

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
} from '@cloudscape-design/components'

// State
import {getState, setState, useState, clearState} from '../../store'

// Components
import {
  Storages,
  StorageType,
  STORAGE_TYPE_PROPS,
  UIStorageSettings,
} from './Storage.types'
import {useFeatureFlag} from '../../feature-flags/useFeatureFlag'
import InfoLink from '../../components/InfoLink'
import TitleDescriptionHelpPanel from '../../components/help-panel/TitleDescriptionHelpPanel'
import {useMemo} from 'react'
import {useHelpPanel} from '../../components/help-panel/HelpPanel'
import {
  STORAGE_NAME_MAX_LENGTH,
  validateStorageName,
} from './Storage/storage.validators'
import {NonCancelableEventHandler} from '@cloudscape-design/components/internal/events'
import {BaseChangeDetail} from '@cloudscape-design/components/input/interfaces'
import {AddStorageForm} from './Storage/AddStorageForm'
import {buildStorageEntries} from './Storage/buildStorageEntries'
import {CheckboxWithHelpPanel} from './Components'

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
  const storageSettings = getState(storagePath)
  let valid = true

  if (storageSettings)
    for (let i = 0; i < storageSettings.length; i++) {
      const settingsType = getState([...storagePath, i, 'StorageType'])
      if (settingsType === 'Ebs') {
        const volumeId = getState([
          ...storagePath,
          i,
          'EbsSettings',
          'VolumeId',
        ])
        const volumeSize = getState([...storagePath, i, 'EbsSettings', 'Size'])
        if (
          !volumeId &&
          (volumeSize === null ||
            volumeSize === '' ||
            volumeSize < 35 ||
            volumeSize > 2048)
        ) {
          setState(
            [...errorsPath, i, 'EbsSettings', 'Size'],
            i18next.t('wizard.storage.validation.volumeSize'),
          )
          valid = false
        } else {
          clearState([...errorsPath, i, 'EbsSettings', 'Size'])
        }
      }
      const name = getState([...storagePath, i, 'Name'])
      const [nameValid, error] = validateStorageName(name)
      if (!nameValid) {
        let errorMessage = ''
        switch (error) {
          case 'forbidden_chars':
            errorMessage = i18next.t(
              'wizard.storage.instance.sourceName.forbiddenCharsError',
            )
            break
          case 'forbidden_keyword':
            errorMessage = i18next.t(
              'wizard.storage.instance.sourceName.forbiddenKeywordError',
            )
            break
          case 'max_length':
            errorMessage = i18next.t(
              'wizard.storage.instance.sourceName.maxLengthError',
              {
                maxChars: STORAGE_NAME_MAX_LENGTH,
              },
            )
            break
          case 'empty':
            errorMessage = i18next.t(
              'wizard.storage.instance.sourceName.emptyError',
            )
            break
        }
        setState([...errorsPath, i, 'Name'], errorMessage)
        valid = false
      } else {
        clearState([...errorsPath, i, 'Name'])
      }
    }

  setState([...errorsPath, 'validated'], true)

  const config = getState(['app', 'wizard', 'config'])
  console.log(config)
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

export function FsxLustreSettings({index}: any) {
  const {t} = useTranslation()
  const isLustrePersistent2Active = useFeatureFlag('lustre_persistent2')
  const useExisting =
    useState(['app', 'wizard', 'storage', 'ui', index, 'useExisting']) || false

  const fsxPath = [...storagePath, index, 'FsxLustreSettings']
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

  const storageCapacity = useState(storageCapacityPath)
  const lustreType = useState(lustreTypePath)
  const storageThroughput = useState(storageThroughputPath)
  const importPath = useState(importPathPath) || ''
  const exportPath = useState(exportPathPath) || ''
  const compression = useState(compressionPath)

  React.useEffect(() => {
    const fsxPath = [...storagePath, index, 'FsxLustreSettings']
    const storageCapacityPath = [...fsxPath, 'StorageCapacity']
    const lustreTypePath = [...fsxPath, 'DeploymentType']
    if (storageCapacity === null && !useExisting)
      setState(storageCapacityPath, 1200)
    if (!storageThroughput && !useExisting) {
      setState(
        storageThroughputPath,
        lustreType === 'PERSISTENT_1'
          ? LUSTRE_PERSISTENT1_DEFAULT_THROUGHPUT
          : LUSTRE_PERSISTENT2_DEFAULT_THROUGHPUT,
      )
    }
    if (lustreType === null && !useExisting)
      setState(
        lustreTypePath,
        isLustrePersistent2Active ? 'PERSISTENT_2' : 'PERSISTENT_1',
      )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    storageCapacity,
    lustreType,
    storageThroughput,
    index,
    useExisting,
    isLustrePersistent2Active,
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

  const throughputFooterLinks = useMemo(
    () => [
      {
        title: t('wizard.storage.Fsx.throughput.link.title'),
        href: t('wizard.storage.Fsx.throughput.link.href'),
      },
    ],
    [t],
  )

  return (
    <ColumnLayout columns={2} borders="vertical">
      <div key="capacity" style={{display: 'flex', flexDirection: 'column'}}>
        <Trans
          i18nKey="wizard.storage.Fsx.capacity.label"
          values={{storageCapacity: storageCapacity}}
        />
        <Input
          value={storageCapacity}
          step={1200}
          onChange={({detail}) => {
            setState(storageCapacityPath, detail.value)
          }}
          onBlur={_e => {
            setState(storageCapacityPath, clampCapacity(storageCapacity))
          }}
          type="number"
        />
      </div>
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
                  <Trans i18nKey="wizard.storage.Fsx.lustreType.help">
                    <a
                      rel="noreferrer"
                      target="_blank"
                      href="https://docs.aws.amazon.com/parallelcluster/latest/ug/SharedStorage-v3.html#yaml-SharedStorage-FsxLustreSettings-DeploymentType"
                    ></a>
                  </Trans>
                }
              />
            }
          />
        }
      >
        <Select
          selectedOption={strToOption(lustreType || 'PERSISTENT_1')}
          onChange={({detail}) => {
            setState(lustreTypePath, detail.selectedOption.value)
            setState(
              storageThroughputPath,
              detail.selectedOption.value === 'PERSISTENT_1'
                ? LUSTRE_PERSISTENT1_DEFAULT_THROUGHPUT
                : LUSTRE_PERSISTENT2_DEFAULT_THROUGHPUT,
            )
          }}
          options={lustreTypes.map(strToOption)}
        />
      </FormField>
      {lustreType === 'PERSISTENT_1' && (
        <>
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
        </>
      )}

      {['PERSISTENT_1', 'PERSISTENT_2'].includes(lustreType) && (
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
      )}
      <SpaceBetween direction="horizontal" size="xs">
        <Checkbox checked={compression !== null} onChange={toggleCompression}>
          <Trans i18nKey="wizard.storage.Fsx.compression.label" />
        </Checkbox>
        <InfoLink
          helpPanel={
            <TitleDescriptionHelpPanel
              title={t('wizard.storage.Fsx.compression.label')}
              description={
                <Trans i18nKey="wizard.storage.Fsx.compression.help">
                  <a
                    rel="noreferrer"
                    target="_blank"
                    href="https://docs.aws.amazon.com/parallelcluster/latest/ug/SharedStorage-v3.html#yaml-SharedStorage-FsxLustreSettings-DataCompressionType"
                  ></a>
                </Trans>
              }
            />
          }
        />
      </SpaceBetween>
    </ColumnLayout>
  )
}

function EfsSettings({index}: any) {
  const efsPath = [...storagePath, index, 'EfsSettings']
  const encryptedPath = [...efsPath, 'Encrypted']
  const kmsPath = [...efsPath, 'KmsKeyId']
  const performancePath = [...efsPath, 'PerformanceMode']
  const performanceModes = ['generalPurpose', 'maxIO']
  const {t} = useTranslation()

  const throughputModePath = [...efsPath, 'ThroughputMode']
  const provisionedThroughputPath = [...efsPath, 'ProvisionedThroughput']

  let encrypted = useState(encryptedPath)
  let kmsId = useState(kmsPath)
  let performanceMode = useState(performancePath) || 'generalPurpose'
  let throughputMode = useState(throughputModePath)
  let provisionedThroughput = useState(provisionedThroughputPath)

  React.useEffect(() => {
    const efsPath = [...storagePath, index, 'EfsSettings']
    const throughputModePath = [...efsPath, 'ThroughputMode']
    const provisionedThroughputPath = [...efsPath, 'ProvisionedThroughput']
    if (throughputMode === null) setState(throughputModePath, 'bursting')
    else if (throughputMode === 'bursting')
      clearState([provisionedThroughputPath])
  }, [index, throughputMode])

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

  return (
    <SpaceBetween direction="vertical" size="s">
      <ColumnLayout columns={2} borders="vertical">
        <FormField label={t('wizard.storage.Efs.performanceMode.label')}>
          <Select
            selectedOption={strToOption(performanceMode)}
            onChange={({detail}) => {
              setState(performancePath, detail.selectedOption.value)
            }}
            options={performanceModes.map(strToOption)}
          />
        </FormField>
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
              setState(
                throughputModePath,
                throughputMode === 'bursting' ? 'provisioned' : 'bursting',
              )
              if (throughputMode === 'provisioned')
                setState(provisionedThroughputPath, 128)
            }}
          >
            {t('wizard.storage.Efs.provisioned.label')}
          </CheckboxWithHelpPanel>
          {throughputMode === 'provisioned' && (
            <Input
              type="number"
              value={clamp(parseInt(provisionedThroughput), 1, 1024).toString()}
              onChange={({detail}) => {
                setState(
                  provisionedThroughputPath,
                  clamp(parseInt(detail.value), 1, 1024).toString(),
                )
              }}
            />
          )}
        </SpaceBetween>
      </ColumnLayout>
    </SpaceBetween>
  )
}

function EbsSettings({index}: any) {
  const {t} = useTranslation()
  const ebsPath = [...storagePath, index, 'EbsSettings']
  const volumeTypePath = [...ebsPath, 'VolumeType']
  const volumeTypes = ['gp3', 'gp2', 'io1', 'io2', 'sc1', 'st1', 'standard']
  const defaultVolumeType = 'gp3'
  const volumeSizePath = [...ebsPath, 'Size']
  const encryptedPath = [...ebsPath, 'Encrypted']
  const kmsPath = [...ebsPath, 'KmsKeyId']
  const snapshotIdPath = [...ebsPath, 'SnapshotId']

  const deletionPolicyPath = [...ebsPath, 'DeletionPolicy']
  const deletionPolicies = ['Delete', 'Retain', 'Snapshot']

  const volumeErrors = useState([...errorsPath, index, 'EbsSettings', 'Size'])

  let volumeType = useState(volumeTypePath)
  let volumeSize = useState(volumeSizePath)
  let encrypted = useState(encryptedPath)
  let kmsId = useState(kmsPath)
  let snapshotId = useState(snapshotIdPath)
  let deletionPolicy = useState(deletionPolicyPath)

  let validated = useState([...errorsPath, 'validated'])

  React.useEffect(() => {
    const ebsPath = [...storagePath, index, 'EbsSettings']
    const volumeTypePath = [...ebsPath, 'VolumeType']
    const deletionPolicyPath = [...ebsPath, 'DeletionPolicy']
    const volumeSizePath = [...ebsPath, 'Size']
    if (volumeType === null) setState(volumeTypePath, defaultVolumeType)
    if (deletionPolicy === null) setState(deletionPolicyPath, 'Delete')
    if (volumeSize === null) setState(volumeSizePath, 35)
  }, [volumeType, volumeSize, deletionPolicy, index])

  const toggleEncrypted = () => {
    const setEncrypted = !encrypted
    setState(encryptedPath, setEncrypted)
    if (!setEncrypted) clearState(kmsPath)
  }

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

  const deletionFooterLinks = useMemo(
    () => [
      {
        title: t('wizard.storage.Ebs.deletionPolicy.policyLink.title'),
        href: t('wizard.storage.Ebs.deletionPolicy.policyLink.href'),
      },
    ],
    [t],
  )

  return (
    <SpaceBetween direction="vertical" size="m">
      <ColumnLayout columns={2} borders="vertical">
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <Trans i18nKey="wizard.storage.Ebs.volumeType.label" />:
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
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div style={{display: 'flex', flexGrow: 1, flexShrink: 0}}>
            Volume Size (35-2048 in GB):
          </div>
          <div style={{display: 'flex', flexShrink: 1}}>
            <FormField errorText={volumeErrors}>
              <Input
                inputMode={'decimal'}
                type={'number' as InputProps.Type}
                value={volumeSize}
                onChange={({detail}) => {
                  setState(volumeSizePath, detail.value)
                  validated && storageValidate()
                }}
              />
            </FormField>
          </div>
        </div>
        <FormField
          label={t('wizard.storage.Ebs.encrypted.title')}
          info={
            <InfoLink
              helpPanel={
                <TitleDescriptionHelpPanel
                  title={t('wizard.storage.Ebs.encrypted.title')}
                  description={t('wizard.storage.Ebs.encrypted.help')}
                  footerLinks={encryptionFooterLinks}
                />
              }
            />
          }
        >
          <Checkbox checked={encrypted} onChange={toggleEncrypted}>
            {t('wizard.storage.Ebs.encrypted.label')}
          </Checkbox>

          {encrypted ? (
            <FormField label={t('wizard.storage.Ebs.encrypted.kmsId')}>
              <Input
                value={kmsId}
                onChange={({detail}) => {
                  setState(kmsPath, detail.value)
                }}
              />
            </FormField>
          ) : null}
        </FormField>
        <FormField
          label={t('wizard.storage.Ebs.snapshotId.label')}
          info={
            <InfoLink
              helpPanel={
                <TitleDescriptionHelpPanel
                  title={t('wizard.storage.Ebs.snapshotId.label')}
                  description={t('wizard.storage.Ebs.snapshotId.help')}
                  footerLinks={snapshotFooterLinks}
                />
              }
            />
          }
        >
          <Checkbox
            checked={snapshotId !== null}
            onChange={_event => {
              setState(snapshotIdPath, snapshotId === null ? '' : null)
            }}
          >
            {t('wizard.storage.Ebs.snapshotId.label')}
          </Checkbox>
          {snapshotId !== null && (
            <Input
              value={snapshotId}
              onChange={({detail}) => {
                setState(snapshotIdPath, detail.value)
              }}
            />
          )}
        </FormField>
        <FormField
          label={t('wizard.storage.Ebs.deletionPolicy.label')}
          info={
            <InfoLink
              helpPanel={
                <TitleDescriptionHelpPanel
                  title={t('wizard.storage.Ebs.deletionPolicy.label')}
                  description={t('wizard.storage.Ebs.deletionPolicy.help')}
                  footerLinks={deletionFooterLinks}
                />
              }
            />
          }
        >
          <Select
            selectedOption={strToOption(deletionPolicy || 'Delete')}
            onChange={({detail}) => {
              setState(deletionPolicyPath, detail.selectedOption.value)
            }}
            options={deletionPolicies.map(strToOption)}
          />
        </FormField>
      </ColumnLayout>
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
  const useExisting =
    useState([...uiSettingsForStorage, 'useExisting']) ||
    !(STORAGE_TYPE_PROPS[storageType].maxToCreate > 0)
  const settingsPath = [...path, `${storageType}Settings`]
  const existingPath = STORAGE_TYPE_PROPS[storageType].mountFilesystem
    ? [...settingsPath, 'FileSystemId']
    : [...settingsPath, 'VolumeId']
  const existingId = useState(existingPath) || ''
  const storages = useState(storagePath)
  const uiSettings = useState(['app', 'wizard', 'storage', 'ui'])
  const {t} = useTranslation()

  const fsxFilesystems = useState(['aws', 'fsxFilesystems'])
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
      <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
        <ColumnLayout columns={2} borders="vertical">
          <FormField
            label={t('wizard.storage.instance.sourceName.label')}
            errorText={storageNameErrors}
          >
            <Input value={storageName} onChange={updateStorageName} />
          </FormField>
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
              onChange={({detail}) => {
                setState([...storagePath, index, 'MountDir'], detail.value)
              }}
            />
          </FormField>
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
                  <FormField label={t('wizard.storage.Ebs.existing')}>
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
                  <FormField label={t('wizard.storage.Fsx.existing.fsxLustre')}>
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
                    />
                  </FormField>
                ),
                FsxOpenZfs: (
                  <FormField
                    label={t('wizard.storage.Fsx.existing.fsxOpenZfs')}
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
                    />
                  </FormField>
                ),
                FsxOntap: (
                  <FormField label={t('wizard.storage.Fsx.existing.fsxOnTap')}>
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
                    />
                  </FormField>
                ),
                Efs: (
                  <FormField label="EFS Filesystem">
                    <Select
                      selectedOption={idToOption(existingId || '')}
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
          }[storageType]}
      </div>
    </Container>
  )
}

const ALL_STORAGES: StorageTypeOption[] = [
  ['FsxLustre', 'Amazon FSx for Lustre (FSX)'],
  ['FsxOntap', 'Amazon FSx for NetApp ONTAP (FSX)'],
  ['FsxOpenZfs', 'Amazon FSx for OpenZFS (FSX)'],
  ['Efs', 'Amazon Elastic File System (EFS)'],
  ['Ebs', 'Amazon Elastic Block Store (EBS)'],
]

function Storage() {
  const {t} = useTranslation()
  const storages = useState(storagePath)
  const uiStorageSettings = useState(['app', 'wizard', 'storage', 'ui'])
  const isFsxOnTapActive = useFeatureFlag('fsx_ontap')
  const isFsxOpenZsfActive = useFeatureFlag('fsx_openzsf')
  const canEditFilesystems = useDynamicStorage()

  const hasAddedStorage = storages?.length > 0

  useHelpPanel(<StorageHelpPanel />)

  const storageMaxes: Record<string, number> = {
    FsxLustre: 21,
    FsxOntap: 20,
    FsxOpenZfs: 20,
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
    <SpaceBetween direction="vertical" size="xl">
      <Container>
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
