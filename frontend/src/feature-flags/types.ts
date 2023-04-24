// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
// with the License. A copy of the License is located at
//
// http://aws.amazon.com/apache2.0/
//
// or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
// limitations under the License.

export type AvailableFeature =
  | 'fsx_ontap'
  | 'fsx_openzsf'
  | 'lustre_persistent2'
  | 'multiuser_cluster'
  | 'memory_based_scheduling'
  | 'slurm_accounting'
  | 'slurm_queue_update_strategy'
  | 'queues_multiple_instance_types'
  | 'multi_az'
  | 'on_node_updated'
  | 'dynamic_fs_mount'
  | 'ebs_deletion_policy'
  | 'efs_deletion_policy'
  | 'lustre_deletion_policy'
  | 'imds_support'
  | 'rhel8'
  | 'cost_monitoring'
  | 'experimental'
