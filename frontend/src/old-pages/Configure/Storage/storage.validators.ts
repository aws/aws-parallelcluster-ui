import {EbsStorage, EfsStorage, Storage} from '../Storage.types'
import {mapStorageToExternalFileSystem} from './storage.mapper'

export const STORAGE_NAME_MAX_LENGTH = 30
export const storageNameErrorsMapping = {
  forbidden_keyword: 'wizard.storage.instance.sourceName.forbiddenKeywordError',
  forbidden_chars: 'wizard.storage.instance.sourceName.forbiddenCharsError',
  max_length: 'wizard.storage.instance.sourceName.maxLengthError',
  empty: 'wizard.storage.instance.sourceName.emptyError',
}
type StorageNameErrorKind = keyof typeof storageNameErrorsMapping

export const ebsErrorsMapping = {
  invalid_ebs_size: 'wizard.storage.Ebs.validation.volumeSize',
}
type EbsErrorKind = keyof typeof ebsErrorsMapping

export const efsErrorsMapping = {
  provisioned_throughput_undefined:
    'wizard.storage.Efs.validation.provisionedThroughput',
}
type EfsErrorKind = keyof typeof efsErrorsMapping

export const externalFsErrorsMapping = {
  external_fs_undefined: 'wizard.storage.instance.useExisting.error',
}
type ExternalFsErrorKind = keyof typeof externalFsErrorsMapping

export function validateStorageName(
  name: string,
): [boolean, StorageNameErrorKind?] {
  if (!name) {
    return [false, 'empty']
  }
  if (name.length > STORAGE_NAME_MAX_LENGTH) {
    return [false, 'max_length']
  }
  if (name === 'default') {
    return [false, 'forbidden_keyword']
  }
  if (!/^([\w\+\-\=\.\_\:\@/]{0,256})$/.test(name)) {
    return [false, 'forbidden_chars']
  }
  return [true]
}

export function validateEbs(ebsStorage: EbsStorage): [boolean, EbsErrorKind?] {
  const volumeSize = ebsStorage.EbsSettings?.Size

  if (volumeSize === undefined || volumeSize < 35 || volumeSize > 2048) {
    return [false, 'invalid_ebs_size']
  } else {
    return [true]
  }
}

export function validateEfs(efsStorage: EfsStorage): [boolean, EfsErrorKind?] {
  const throughputMode = efsStorage.EfsSettings?.ThroughputMode
  const provisionedThroughput = efsStorage.EfsSettings?.ProvisionedThroughput

  if (throughputMode === 'provisioned' && !provisionedThroughput) {
    return [false, 'provisioned_throughput_undefined']
  } else {
    return [true]
  }
}

export function validateExternalFileSystem(
  storage: Storage,
): [boolean, ExternalFsErrorKind?] {
  const externalFileSystemId = mapStorageToExternalFileSystem(storage)
  return externalFileSystemId ? [true] : [false, 'external_fs_undefined']
}
