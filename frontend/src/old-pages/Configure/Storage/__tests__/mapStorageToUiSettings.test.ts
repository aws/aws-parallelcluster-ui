// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
// with the License. A copy of the License is located at
//
// http://aws.amazon.com/apache2.0/
//
// or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
// limitations under the License.

import {mock, MockProxy} from 'jest-mock-extended'
import {
  EbsStorage,
  EfsStorage,
  FsxLustreStorage,
  FsxOnTapStorage,
  FsxOpenZfsStorage,
  Storages,
  Storage,
} from '../../Storage.types'
import {mapStorageToUiSettings} from '../storage.mapper'

const commonStorageValues = {
  Name: 'some-name',
  MountDir: 'some-dir',
}

const EbsWithExternalVolume: EbsStorage = {
  ...commonStorageValues,
  StorageType: 'Ebs',
  EbsSettings: {
    VolumeId: 'some-id',
  },
}

const EbsWithoutExternalVolume: EbsStorage = {
  ...commonStorageValues,
  StorageType: 'Ebs',
  EbsSettings: {
    VolumeId: undefined,
  },
}

const EfsWithExternalVolume: EfsStorage = {
  ...commonStorageValues,
  StorageType: 'Efs',
  EfsSettings: {
    ProvisionedThroughput: 1000,
    FileSystemId: 'some-id',
  },
}

const EfsWithoutExternalVolume: EfsStorage = {
  ...commonStorageValues,
  StorageType: 'Efs',
  EfsSettings: {
    ProvisionedThroughput: 1000,
    FileSystemId: undefined,
  },
}

const FsxLustreWithExternalVolume: FsxLustreStorage = {
  ...commonStorageValues,
  StorageType: 'FsxLustre',
  FsxLustreSettings: {
    StorageCapacity: 1200,
    FileSystemId: 'some-id',
  },
}

const FsxLustreWithoutExternalVolume: FsxLustreStorage = {
  ...commonStorageValues,
  StorageType: 'FsxLustre',
  FsxLustreSettings: {
    StorageCapacity: 1200,
    FileSystemId: undefined,
  },
}

const FsxOnTapWithExternalVolume: FsxOnTapStorage = {
  ...commonStorageValues,
  StorageType: 'FsxOnTap',
  FsxOnTapSettings: {
    VolumeId: 'some-id',
  },
}

const FsxOpenZfsWithExternalVolume: FsxOpenZfsStorage = {
  ...commonStorageValues,
  StorageType: 'FsxOpenZsf',
  FsxOpenZfsSettings: {
    VolumeId: 'some-id',
  },
}

const cases: [string, Storage, boolean][] = [
  ['Ebs with external volume', EbsWithExternalVolume, true],
  ['Ebs without external volume', EbsWithoutExternalVolume, false],
  ['Efs with external volume', EfsWithExternalVolume, true],
  ['Efs without external volume', EfsWithoutExternalVolume, false],
  ['FsxLustre with external volume', FsxLustreWithExternalVolume, true],
  ['FsxLustre without external volume', FsxLustreWithoutExternalVolume, false],
  ['FsxOnTap with external volume', FsxOnTapWithExternalVolume, true],
  ['FsxOpenZfs with external volume', FsxOpenZfsWithExternalVolume, true],
]

describe('given a mapper to import the SharedStorage section of the config', () => {
  let mockStorages: MockProxy<Storages>

  describe('when no storage exists', () => {
    beforeEach(() => {
      mockStorages = mock<Storages>([])
    })

    it('should return an empty array', () => {
      expect(mapStorageToUiSettings(mockStorages)).toEqual([])
    })
  })

  describe.each(cases)(
    'when the storage is %s',
    (_, storage, expectedvalue) => {
      beforeEach(() => {
        mockStorages = mock<Storages>([{...storage}])
      })

      it(`should set the use existing toggle to ${
        expectedvalue ? 'enabled' : 'disabled'
      }`, () => {
        expect(mapStorageToUiSettings(mockStorages)).toEqual([
          {useExisting: expectedvalue},
        ])
      })
    },
  )
})
