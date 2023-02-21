// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
// with the License. A copy of the License is located at
//
// http://aws.amazon.com/apache2.0/
//
// or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
// limitations under the License.

import {Storage, Storages, UIStorageSettings} from '../Storage.types'

function mapStorageToUiSetting(storage: Storage): UIStorageSettings[0] {
  switch (storage.StorageType) {
    case 'Ebs':
      return {useExisting: !!storage.EbsSettings?.VolumeId}
    case 'Efs':
      return {useExisting: !!storage.EfsSettings?.FileSystemId}
    case 'FsxLustre':
      return {useExisting: !!storage.FsxLustreSettings?.FileSystemId}
    case 'FsxOntap':
      return {useExisting: !!storage.FsxOntapSettings?.VolumeId}
    case 'FsxOpenZfs':
      return {useExisting: !!storage.FsxOpenZfsSettings?.VolumeId}
  }
}

export function mapStorageToUiSettings(storages: Storages): UIStorageSettings {
  return storages.map(mapStorageToUiSetting)
}
