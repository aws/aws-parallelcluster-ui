// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
// with the License. A copy of the License is located at
//
// http://aws.amazon.com/apache2.0/
//
// or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
// limitations under the License.

import {AvailableFeature} from './types'

const versionToFeaturesMap: Record<string, AvailableFeature[]> = {
  // Placing ubuntu1804 here to be counted as a feature flag, so it can be deprecated
  '3.0.0': ['ubuntu1804'],
  '3.1.0': ['multiuser_cluster'],
  '3.2.0': [
    'fsx_ontap',
    'fsx_openzsf',
    'lustre_persistent2',
    'memory_based_scheduling',
    'multiuser_cluster',
    'slurm_queue_update_strategy',
    'ebs_deletion_policy',
    'cost_monitoring',
  ],
  '3.3.0': [
    'slurm_accounting',
    'queues_multiple_instance_types',
    'dynamic_fs_mount',
    'efs_deletion_policy',
    'lustre_deletion_policy',
    'imds_support',
  ],
  '3.4.0': ['multi_az', 'on_node_updated'],
  '3.6.0': ['rhel8', 'new_resources_limits'],
  '3.7.0': [
    'ubuntu2204',
    'login_nodes',
    'amazon_file_cache',
    'job_exclusive_allocation',
    'memory_based_scheduling_with_multiple_instance_types',
  ],
}

const featureToDeperecatedVersionMap: Partial<
  Record<AvailableFeature, string>
> = {
  ubuntu1804: '3.7.0',
}

function isNotDeprecated(
  feature: AvailableFeature,
  currentVersion: string,
): boolean {
  if (feature in featureToDeperecatedVersionMap) {
    if (currentVersion >= featureToDeperecatedVersionMap[feature]!) {
      return false
    }
  }
  return true
}

const featureToUnsupportedRegionsMap: Partial<
  Record<AvailableFeature, string[]>
> = {
  cost_monitoring: ['us-gov-west-1'],
}

function isSupportedInRegion(
  feature: AvailableFeature,
  region?: string,
): boolean {
  if (feature in featureToUnsupportedRegionsMap) {
    if (!region) {
      return false
    } else {
      return !featureToUnsupportedRegionsMap[feature]!.includes(region)
    }
  }
  return true
}

function composeFlagsListByVersion(currentVersion: string): AvailableFeature[] {
  let features: Set<AvailableFeature> = new Set([])

  for (let version in versionToFeaturesMap) {
    if (currentVersion >= version) {
      features = new Set([...features, ...versionToFeaturesMap[version]])
    }
  }

  return Array.from(features)
}

export function featureFlagsProvider(
  version: string,
  region?: string,
): AvailableFeature[] {
  const features: AvailableFeature[] = []
  const additionalFeatures = window.sessionStorage.getItem('additionalFeatures')
  const additionalFeaturesParsed = additionalFeatures
    ? JSON.parse(additionalFeatures)
    : []

  return features
    .concat(composeFlagsListByVersion(version))
    .concat(additionalFeaturesParsed)
    .filter(feature => isSupportedInRegion(feature, region))
    .filter(feature => isNotDeprecated(feature, version))
}
