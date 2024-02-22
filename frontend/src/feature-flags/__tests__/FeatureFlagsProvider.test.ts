// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
// with the License. A copy of the License is located at
//
// http://aws.amazon.com/apache2.0/
//
// or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
// limitations under the License.

import {featureFlagsProvider} from '../featureFlagsProvider'
import {AvailableFeature} from '../types'

describe('given a feature flags provider and a list of rules', () => {
  const subject = featureFlagsProvider
  let region: string | undefined = 'us-west-1'

  describe('when the features list is retrieved', () => {
    it('should return the list', async () => {
      const features = await subject('0.0.0', region)
      expect(features).toEqual<AvailableFeature[]>([])
    })
  })

  describe('when the version is between 3.1.0 and 3.2.0', () => {
    it('should return the list of available features', async () => {
      const features = await subject('3.1.5', region)
      expect(features).toEqual<AvailableFeature[]>([
        'ubuntu1804',
        'multiuser_cluster',
      ])
    })
  })

  describe('when the version is between 3.2.0 and 3.3.0', () => {
    it('should return the list of available features', async () => {
      const features = await subject('3.2.5', region)
      expect(features).toEqual<AvailableFeature[]>([
        'ubuntu1804',
        'multiuser_cluster',
        'fsx_ontap',
        'fsx_openzsf',
        'lustre_persistent2',
        'memory_based_scheduling',
        'slurm_queue_update_strategy',
        'ebs_deletion_policy',
        'cost_monitoring',
      ])
    })
  })

  describe('when the version is between 3.3.0 and 3.4.0', () => {
    it('should return the list of available features', async () => {
      const features = await subject('3.3.2', region)
      expect(features).toEqual<AvailableFeature[]>([
        'ubuntu1804',
        'multiuser_cluster',
        'fsx_ontap',
        'fsx_openzsf',
        'lustre_persistent2',
        'memory_based_scheduling',
        'slurm_queue_update_strategy',
        'ebs_deletion_policy',
        'cost_monitoring',
        'slurm_accounting',
        'queues_multiple_instance_types',
        'dynamic_fs_mount',
        'efs_deletion_policy',
        'lustre_deletion_policy',
        'imds_support',
      ])
    })
  })

  describe('when the version is between 3.4.0 and 3.6.0', () => {
    it('should return the list of available features', async () => {
      const features = await subject('3.4.1', region)
      expect(features).toEqual<AvailableFeature[]>([
        'ubuntu1804',
        'multiuser_cluster',
        'fsx_ontap',
        'fsx_openzsf',
        'lustre_persistent2',
        'memory_based_scheduling',
        'slurm_queue_update_strategy',
        'ebs_deletion_policy',
        'cost_monitoring',
        'slurm_accounting',
        'queues_multiple_instance_types',
        'dynamic_fs_mount',
        'efs_deletion_policy',
        'lustre_deletion_policy',
        'imds_support',
        'multi_az',
        'on_node_updated',
      ])
    })
  })

  describe('when the version is between 3.6.0 and 3.7.0', () => {
    it('should return the list of available features', async () => {
      const features = await subject('3.6.1', region)
      expect(features).toEqual<AvailableFeature[]>([
        'ubuntu1804',
        'multiuser_cluster',
        'fsx_ontap',
        'fsx_openzsf',
        'lustre_persistent2',
        'memory_based_scheduling',
        'slurm_queue_update_strategy',
        'ebs_deletion_policy',
        'cost_monitoring',
        'slurm_accounting',
        'queues_multiple_instance_types',
        'dynamic_fs_mount',
        'efs_deletion_policy',
        'lustre_deletion_policy',
        'imds_support',
        'multi_az',
        'on_node_updated',
        'rhel8',
        'new_resources_limits',
      ])
    })
  })

  describe('when the version is above and 3.7.0', () => {
    it('should return the list of available features', async () => {
      const features = await subject('3.7.0', region)
      expect(features).toEqual<AvailableFeature[]>([
        'multiuser_cluster',
        'fsx_ontap',
        'fsx_openzsf',
        'lustre_persistent2',
        'memory_based_scheduling',
        'slurm_queue_update_strategy',
        'ebs_deletion_policy',
        'cost_monitoring',
        'slurm_accounting',
        'queues_multiple_instance_types',
        'dynamic_fs_mount',
        'efs_deletion_policy',
        'lustre_deletion_policy',
        'imds_support',
        'multi_az',
        'on_node_updated',
        'rhel8',
        'new_resources_limits',
        'ubuntu2204',
        'login_nodes',
        'amazon_file_cache',
        'job_exclusive_allocation',
        'memory_based_scheduling_with_multiple_instance_types',
      ])
    })
  })

  describe('when an additional feature has been enabled through the browser session storage', () => {
    beforeEach(() => {
      window.sessionStorage.clear()
      window.sessionStorage.setItem('additionalFeatures', '["cost_monitoring"]')
    })
    it('should be included in the list of features', async () => {
      const features = await subject('3.1.5', region)
      expect(features).toEqual<AvailableFeature[]>([
        'ubuntu1804',
        'multiuser_cluster',
        'cost_monitoring',
      ])
    })
  })

  describe('when no additional features have been enabled through the browser session storage', () => {
    beforeEach(() => {
      window.sessionStorage.clear()
    })
    it('should not be included in the list of features', async () => {
      const features = await subject('3.1.5', region)
      expect(features).toEqual<AvailableFeature[]>([
        'ubuntu1804',
        'multiuser_cluster',
      ])
    })
  })

  describe('when a feature has been deprecated', () => {
    it('should return the list of available features without the unsupported feature', async () => {
      const features = await subject('3.7.1', region)
      expect(features).not.toContain<AvailableFeature[]>(['ubuntu1804'])
    })
  })

  describe('when a feature is not supported in a region', () => {
    it('should return the list of available features without the unsupported feature', async () => {
      region = 'us-gov-west-1'
      const features = await subject('3.6.0', region)
      expect(features).not.toContain<AvailableFeature[]>(['cost_monitoring'])
    })
  })

  describe('when a feature is not supported in a region and the region is undefined', () => {
    it('should return an empty list', async () => {
      region = undefined
      const features = await subject('3.6.0', region)
      expect(features).not.toContain<AvailableFeature[]>(['cost_monitoring'])
    })
  })
})
