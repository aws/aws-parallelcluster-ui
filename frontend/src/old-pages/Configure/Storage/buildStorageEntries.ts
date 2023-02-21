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

import {canCreateStorage} from '../Storage'
import {Storages, UIStorageSettings, StorageType} from '../Storage.types'

export function buildStorageEntries(
  storages: Storages,
  uiStorageSettings: UIStorageSettings,
  selectedStorageTypes: StorageType[],
): [Storages, UIStorageSettings] {
  const storageEntries: Storages = []
  const uiSettingsEntries: UIStorageSettings = []

  const firstIndex = storages.length

  selectedStorageTypes.forEach((storageType: StorageType, index: number) => {
    const storageIndex = firstIndex + index
    const useExisting = !canCreateStorage(
      storageType,
      storages,
      uiStorageSettings,
    )

    const storageEntry: Storages[0] = {
      Name: `${storageType}${storageIndex}`,
      StorageType: storageType,
      MountDir: '/shared',
    }
    const uiSettingsEntry = {
      useExisting,
    }

    storageEntries.push(storageEntry)
    uiSettingsEntries.push(uiSettingsEntry)
  })

  return [storageEntries, uiSettingsEntries]
}
