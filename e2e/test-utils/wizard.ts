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

import { expect, Page } from "@playwright/test";

const CLUSTER_NAME = 'c' + Math.random().toString(20).substring(8)

export async function fillClusterSection(page: Page, selectVPC = true) {
  await expect(page.getByRole('heading', { name: 'Cluster', exact: true })).toBeVisible()
  
  await page.getByPlaceholder('Enter your cluster name').fill(CLUSTER_NAME);

  if (selectVPC) {
    await page.getByRole('button', { name: 'Select a VPC' }).click();
    await page.getByText(/vpc-.*/).first().click();
  } else {
    await page.getByText(/vpc-.*/).waitFor({state: 'visible'})
  }
  
  await page.getByRole('button', { name: 'Next' }).click();
}

export async function fillHeadNodeSection(page: Page) {
  await expect(page.getByRole('heading', { name: 'Head node' })).toBeVisible()
  
  await page.getByRole('button', { name: 'Next' }).click();
}

export async function fillQueuesSection(page: Page) {
  await expect(page.getByRole('heading', { name: 'Queues' }).first()).toBeVisible()
  
  await page.getByRole('button', { name: 'Next' }).click();
}

export async function fillStorageSection(page: Page) {
  await expect(page.getByRole('heading', { name: 'Storage' })).toBeVisible()
  
  await page.getByRole('button', { name: 'Next' }).click();
}

export async function performDryRun(page: Page) {
  await expect(page.getByRole('heading', { name: 'Create' })).toBeVisible()
    
  await page.getByRole('button', { name: 'Dry run' }).click();
  
  await expect(page.getByText('Request would have succeeded, but DryRun flag is set.')).toBeVisible()
}