// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
// with the License. A copy of the License is located at
//
// http://aws.amazon.com/apache2.0/
//
// or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
// limitations under the License.

import {EbsStorage} from '../../Storage.types'
import {validateEbs} from '../storage.validators'

describe('Given a function to validate an EBS storage', () => {
  describe('when the size is not defined', () => {
    const ebsStorage: EbsStorage = {
      Name: 'Ebs',
      MountDir: '/moundDir',
      StorageType: 'Ebs',
    }
    it('should fail the validation', () => {
      expect(validateEbs(ebsStorage)).toEqual([false, 'invalid_ebs_size'])
    })
  })

  describe('when the size is less than 35', () => {
    const ebsStorage: EbsStorage = {
      Name: 'Ebs',
      MountDir: '/moundDir',
      StorageType: 'Ebs',
      EbsSettings: {
        Size: 0,
      },
    }
    it('should fail the validation', () => {
      expect(validateEbs(ebsStorage)).toEqual([false, 'invalid_ebs_size'])
    })
  })

  describe('when the size is greater than 2048', () => {
    const ebsStorage: EbsStorage = {
      Name: 'Ebs',
      MountDir: '/moundDir',
      StorageType: 'Ebs',
      EbsSettings: {
        Size: 2050,
      },
    }
    it('should fail the validation', () => {
      expect(validateEbs(ebsStorage)).toEqual([false, 'invalid_ebs_size'])
    })
  })

  describe('when the size is between 35 and 2048', () => {
    const ebsStorage: EbsStorage = {
      Name: 'Ebs',
      MountDir: '/moundDir',
      StorageType: 'Ebs',
      EbsSettings: {
        Size: 256,
      },
    }
    it('should be validated', () => {
      expect(validateEbs(ebsStorage)).toEqual([true])
    })
  })
})
