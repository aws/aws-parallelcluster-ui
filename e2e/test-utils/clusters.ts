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

import { Page } from "@playwright/test";

const DEFAULT_CLUSTER_TO_SELECT = 'DO-NOT-DELETE'

export async function selectCluster(page: Page, clusterName: string = DEFAULT_CLUSTER_TO_SELECT) {
  await page.getByRole('row', { name: clusterName })
    .getByRole('radio')
    .click();
}

export enum ClusterAction {
  VIEW_LOGS = 'View logs'
}

export async function selectClusterAction(page: Page, action: ClusterAction) {
  await page.getByRole('button', { name: 'Actions', exact: true }).click();
  await page.getByRole('menuitem', { name: action, exact: true }).click();
}