// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
// with the License. A copy of the License is located at
//
// http://aws.amazon.com/apache2.0/
//
// or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
// limitations under the License.

import {isFeatureEnabled} from '../../../feature-flags/useFeatureFlag'
import {
  SingleInstanceComputeResource,
  MultiInstanceComputeResource,
} from './queues.types'

function mapComputeResource(
  computeResource: SingleInstanceComputeResource | MultiInstanceComputeResource,
): MultiInstanceComputeResource {
  // If it's already a MultiInstanceComputeResource and Instances exist, return it directly
  if ('Instances' in computeResource && computeResource.Instances?.length) {
    return computeResource
  }

  // If it's of SingleInstanceComputeResource type, convert it to MultiInstanceComputeResource
  if ('InstanceType' in computeResource) {
    const {InstanceType, ...otherComputeResourceConfig} = computeResource

    return {
      ...otherComputeResourceConfig,
      Instances: [
        {
          InstanceType,
        },
      ],
    }
  }

  // If Instances are cleared or do not exist, return the other configurations
  const {Instances, ...otherComputeResourceConfig} = computeResource
  return {
    ...otherComputeResourceConfig,
  }
}

export function mapComputeResources(
  version: string,
  region: string,
  computeResourcesConfig:
    | SingleInstanceComputeResource[]
    | MultiInstanceComputeResource[],
) {
  if (!isFeatureEnabled(version, region, 'queues_multiple_instance_types')) {
    return computeResourcesConfig
  }

  return computeResourcesConfig.map(mapComputeResource)
}
