// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
// with the License. A copy of the License is located at
//
// http://aws.amazon.com/apache2.0/
//
// or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
// limitations under the License.

import {Storages, StorageType, UIStorageSettings} from '../../Storage.types'
import {buildStorageEntries} from '../buildStorageEntries'

describe('given a function to convert user storage selections to the internal state representations', () => {
  let mockStorages: Storages
  let mockUiStorageSettings: UIStorageSettings
  let mockSelectedStorageTypes: StorageType[]

  describe('and the current storage configuration', () => {
    describe('and a list of selected storage types', () => {
      beforeEach(() => {
        mockSelectedStorageTypes = ['Ebs', 'Efs']
      })

      describe('when no storage has been selected yet', () => {
        beforeEach(() => {
          mockStorages = []
          mockUiStorageSettings = []
        })

        it('should return the storage entries', () => {
          const [storageEntries] = buildStorageEntries(
            mockStorages,
            mockUiStorageSettings,
            mockSelectedStorageTypes,
          )
          expect(storageEntries).toEqual([
            {
              StorageType: 'Ebs',
              Name: 'Ebs0',
              MountDir: '/shared',
            },
            {
              StorageType: 'Efs',
              Name: 'Efs1',
              MountDir: '/shared',
            },
          ])
        })
        it('should return the storage ui configuration', () => {
          const [_, uiStorageSettingsEntries] = buildStorageEntries(
            mockStorages,
            mockUiStorageSettings,
            mockSelectedStorageTypes,
          )
          expect(uiStorageSettingsEntries).toEqual([
            {useExisting: false},
            {useExisting: false},
          ])
        })
      })
      describe('when some storage had already been selected', () => {
        beforeEach(() => {
          mockStorages = [
            {
              StorageType: 'Ebs',
              Name: 'Ebs0',
              MountDir: '/shared',
            },
          ]
          mockUiStorageSettings = [{useExisting: false}]
        })

        it('should return the storage entries with unique names', () => {
          const [storageEntries] = buildStorageEntries(
            mockStorages,
            mockUiStorageSettings,
            mockSelectedStorageTypes,
          )
          expect(storageEntries).toEqual([
            {
              StorageType: 'Ebs',
              Name: 'Ebs1',
              MountDir: '/shared',
            },
            {
              StorageType: 'Efs',
              Name: 'Efs2',
              MountDir: '/shared',
            },
          ])
        })
        it('should update the storage ui configuration', () => {
          const [_, uiStorageSettingsEntries] = buildStorageEntries(
            mockStorages,
            mockUiStorageSettings,
            mockSelectedStorageTypes,
          )
          expect(uiStorageSettingsEntries).toEqual([
            {useExisting: false},
            {useExisting: false},
          ])
        })
      })
    })
  })
})
