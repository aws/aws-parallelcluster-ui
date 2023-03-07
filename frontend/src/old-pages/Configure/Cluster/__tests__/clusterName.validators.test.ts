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

import {validateClusterName} from '../clusterName.validators'

describe('given a cluster name', () => {
  const mockClusterNames = new Set(['cluster1', 'cluster2'])

  describe("when it's blank", () => {
    it('should fail the validation', () => {
      expect(validateClusterName(mockClusterNames, '')).toEqual([
        false,
        'empty',
      ])
    })
  })

  describe('when there is another cluster with the same name', () => {
    it('should fail the validation', () => {
      expect(validateClusterName(mockClusterNames, 'cluster1')).toEqual([
        false,
        'existing_name',
      ])
    })
  })

  describe('when one or more bad characters are given', () => {
    it('should fail the validation', () => {
      expect(validateClusterName(mockClusterNames, ';')).toEqual([
        false,
        'forbidden_chars',
      ])
      expect(validateClusterName(mockClusterNames, '``')).toEqual([
        false,
        'forbidden_chars',
      ])
      expect(validateClusterName(mockClusterNames, '#')).toEqual([
        false,
        'forbidden_chars',
      ])
    })
  })

  describe('when no bad characters are given', () => {
    it('should be validated', () => {
      expect(
        validateClusterName(mockClusterNames, 'some-cluster-name'),
      ).toEqual([true])
    })
  })
})
