// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
// with the License. A copy of the License is located at
//
// http://aws.amazon.com/apache2.0/
//
// or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
// limitations under the License.

import {EbsStorage, EfsStorage} from '../../Storage.types'
import {validateExternalFileSystem} from '../storage.validators'

describe('Given a function to validate if an external filesystem has been selected on a storage', () => {
  describe('when the external filesystem is not defined on a EFS storage', () => {
    const efsStorage: EfsStorage = {
      Name: 'Efs',
      MountDir: '/moundDir',
      StorageType: 'Efs',
    }
    it('should fail the validation', () => {
      expect(validateExternalFileSystem(efsStorage)).toEqual([
        false,
        'external_fs_undefined',
      ])
    })
  })

  describe('when the external filesystem is not defined on a EBS storage', () => {
    const ebsStorage: EbsStorage = {
      Name: 'Ebs',
      MountDir: '/moundDir',
      StorageType: 'Ebs',
    }
    it('should fail the validation', () => {
      expect(validateExternalFileSystem(ebsStorage)).toEqual([
        false,
        'external_fs_undefined',
      ])
    })
  })

  describe('when the external filesystem is defined on a EFS storage', () => {
    const efsStorage: EfsStorage = {
      Name: 'Efs',
      MountDir: '/moundDir',
      StorageType: 'Efs',
      EfsSettings: {
        FileSystemId: 'fileSystemId',
        ProvisionedThroughput: 0,
      },
    }
    it('should be validated', () => {
      expect(validateExternalFileSystem(efsStorage)).toEqual([true])
    })
  })

  describe('when the external filesystem is defined on a EBS storage', () => {
    const ebsStorage: EbsStorage = {
      Name: 'Ebs',
      MountDir: '/moundDir',
      StorageType: 'Ebs',
      EbsSettings: {
        VolumeId: 'volumeId',
      },
    }
    it('should be validated', () => {
      expect(validateExternalFileSystem(ebsStorage)).toEqual([true])
    })
  })
})
