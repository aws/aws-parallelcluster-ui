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

import {wizardStateToKeepOnRegionChange} from '../Cluster'

describe('given a function to get the wizard state to keep when the region changes', () => {
  describe('when the wizard state has values', () => {
    it('should keep the page, source, cluster name, errors and version, and drop the rest', () => {
      const wizardState = {
        page: 'cluster',
        source: {type: 'wizard'},
        clusterName: 'my-cluster',
        errors: {cluster: {}},
        version: '3.16.3',
        config: {Region: 'eu-west-1', Image: {Os: 'alinux2023'}},
        vpc: 'vpc-123',
      }

      expect(wizardStateToKeepOnRegionChange(wizardState)).toEqual({
        page: 'cluster',
        source: {type: 'wizard'},
        clusterName: 'my-cluster',
        errors: {cluster: {}},
        version: '3.16.3',
      })
    })
  })

  describe('when the wizard state is not set', () => {
    it('should return all values as undefined', () => {
      expect(wizardStateToKeepOnRegionChange(undefined)).toEqual({
        page: undefined,
        source: undefined,
        clusterName: undefined,
        errors: undefined,
        version: undefined,
      })
    })
  })
})
