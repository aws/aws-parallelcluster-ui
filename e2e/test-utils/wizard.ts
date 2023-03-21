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

const DEFAULT_CONFIG: Config = {
  clusterName: 'c' + Math.random().toString(20).substring(8),
}

interface Config {
  clusterName: string;
  region?: string;
  vpc?: RegExp | string;
}

export async function fillWizard(page: Page, config: Partial<Config> = {}) {
  const configWithDefaults = {
    ...DEFAULT_CONFIG,
    ...config,
  }

  await fillClusterSection(page, configWithDefaults)
  await fillHeadNodeSection(page, configWithDefaults)
  await fillQueuesSection(page, configWithDefaults)
  await fillStorageSection(page, configWithDefaults)
  await performDryRun(page, configWithDefaults)
}

export async function fillClusterSection(page: Page, config: Config) {
  await expect(page.getByRole('heading', { name: 'Cluster', exact: true })).toBeVisible()
  
  await page.getByPlaceholder('Enter your cluster name').fill(config.clusterName);

  if (config.region) {
    await page.getByLabel("Region").click();
    await page.getByText(config.region).first().click();
  }

  if (config.vpc) {
    await page.getByRole('button', { name: 'Select a VPC' }).click();
    await page.getByText(config.vpc).first().click();
  } else {
    await page.getByText(/vpc-.*/).waitFor({state: 'visible'})
  }
  
  await page.getByRole('button', { name: 'Next' }).click();
}

export async function fillHeadNodeSection(page: Page, config: Config) {
  await expect(page.getByRole('heading', { name: 'Head node', exact: true })).toBeVisible()
  
  await page.getByRole('button', { name: 'Next' }).click();
}

export async function fillQueuesSection(page: Page, config: Config) {
  await expect(page.getByRole('heading', { name: 'Queues', exact: true }).first()).toBeVisible()
  
  await page.getByRole('button', { name: 'Next' }).click();
}

export async function fillStorageSection(page: Page, config: Config) {
  await expect(page.getByRole('heading', { name: 'Storage', exact: true })).toBeVisible()
  
  await page.getByRole('button', { name: 'Next' }).click();
}

export async function performDryRun(page: Page, config: Config) {
  await expect(page.getByRole('heading', { name: 'Create', exact: true })).toBeVisible()
    
  await page.getByRole('button', { name: 'Dry run' }).click();
  
  await expect(page.getByText('Request would have succeeded, but DryRun flag is set.')).toBeVisible()
}