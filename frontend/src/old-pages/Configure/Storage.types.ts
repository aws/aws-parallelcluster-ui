/*
 * Used to configure the Storage part of the Cluster wizard:
 *  - controls whether a storage type can be created or just linked
 *  - specify if a storage type can be mounted as a file system or just one of its volumes
 */
export const STORAGE_TYPE_PROPS = {
  FsxLustre: {
    mountFilesystem: true,
    maxToCreate: 1,
    maxExistingToAttach: 20,
  },
  FsxOntap: {
    mountFilesystem: false,
    maxToCreate: 0,
    maxExistingToAttach: 20,
  },
  FsxOpenZfs: {
    mountFilesystem: false,
    maxToCreate: 0,
    maxExistingToAttach: 20,
  },
  Efs: {
    mountFilesystem: true,
    maxToCreate: 1,
    maxExistingToAttach: 20,
  },
  Ebs: {
    mountFilesystem: false,
    maxToCreate: 5,
    maxExistingToAttach: 5,
  },
}

export type StorageType = keyof typeof STORAGE_TYPE_PROPS

export interface EbsSettings {
  VolumeType?: string
  Iops?: number
  Size?: number
  Encrypted?: boolean
  KmsKeyId?: string
  SnapshotId?: string
  Throughput?: number
  VolumeId?: string
  DeletionPolicy?: string
  Raid?: {
    Type: string
    NumberOfVolumes?: number
  }
}

export interface EfsSettings {
  Encrypted?: boolean
  KmsKeyId?: string
  EncryptionInTransit?: boolean
  IamAuthorization?: boolean
  PerformanceMode?: string
  ThroughputMode?: string
  ProvisionedThroughput: number
  FileSystemId?: string
  DeletionPolicy?: string
}

/**
 * Please note: Some of the properties cannot coexist
 * see https://docs.aws.amazon.com/parallelcluster/latest/ug/SharedStorage-v3.html#SharedStorage-v3-FsxLustreSettings
 */
export interface FsxLustreSettings {
  StorageCapacity: number
  DeploymentType?: string
  ImportedFileChunkSize?: number
  DataCompressionType?: string
  ExportPath?: string
  ImportPath?: string
  WeeklyMaintenanceStartTime?: string
  AutomaticBackupRetentionDays?: number
  CopyTagsToBackups?: boolean
  DailyAutomaticBackupStartTime?: string
  PerUnitStorageThroughput?: number
  BackupId?: string
  KmsKeyId?: string
  FileSystemId?: string
  AutoImportPolicy?: string
  DriveCacheType?: string
  StorageType?: string
  DeletionPolicy?: string
}

export interface FsxOnTapSettings {
  VolumeId: string
}

export interface FsxOpenZfsSettings {
  VolumeId: string
}

interface CommonSharedStorageDetails {
  Name: string
  MountDir: string
}

export interface EbsStorage extends CommonSharedStorageDetails {
  StorageType: 'Ebs'
  EbsSettings?: EbsSettings
}

export interface EfsStorage extends CommonSharedStorageDetails {
  StorageType: 'Efs'
  EfsSettings?: EfsSettings
}

export interface FsxLustreStorage extends CommonSharedStorageDetails {
  StorageType: 'FsxLustre'
  FsxLustreSettings?: FsxLustreSettings
}

export interface FsxOnTapStorage extends CommonSharedStorageDetails {
  StorageType: 'FsxOntap'
  FsxOntapSettings?: FsxOnTapSettings
}

export interface FsxOpenZfsStorage extends CommonSharedStorageDetails {
  StorageType: 'FsxOpenZfs'
  FsxOpenZfsSettings?: FsxOpenZfsSettings
}

export type Storage =
  | EbsStorage
  | EfsStorage
  | FsxLustreStorage
  | FsxOnTapStorage
  | FsxOpenZfsStorage

export type Storages = Storage[]

export type UIStorageSettings = {
  useExisting: boolean
}[]
