// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
// with the License. A copy of the License is located at
//
// http://aws.amazon.com/apache2.0/
//
// or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
// limitations under the License.

import { expect, FileChooser, test } from '@playwright/test';
import { visitAndLogin } from '../test-utils/login';

const TEMPLATE_PATH = './fixtures/wizard.template.yaml'
const CLUSTER_NAME = 'c' + Math.random().toString(20).substring(8)

test.describe('environment: @demo', () => {
  test.describe('given a cluster configuration template created with single instance type', () => {
    test.describe('when the file is imported as a template', () => {
      test('user can perform a dry-run successfully', async ({ page }) => {
        await visitAndLogin(page)

        await page.getByRole('button', { name: 'Create cluster' }).first().click();
        
        page.on("filechooser", (fileChooser: FileChooser) => {
          fileChooser.setFiles([TEMPLATE_PATH]);
        })
        await page.getByRole('menuitem', { name: 'Upload a template' }).click();
        
        await expect(page.getByRole('heading', { name: 'Cluster', exact: true })).toBeVisible()
        await page.getByPlaceholder('Enter your cluster name').fill(CLUSTER_NAME);
        await page.getByText(/vpc-.*/).waitFor({state: 'visible'})
        await page.getByRole('button', { name: 'Next' }).click();

        await expect(page.getByRole('heading', { name: 'Head node', exact: true })).toBeVisible()
        await page.getByRole('button', { name: 'Next' }).click();

        await expect(page.getByRole('heading', { name: 'Queues' }).first()).toBeVisible()
        await page.getByRole('button', { name: 'Next' }).click();

        await expect(page.getByRole('heading', { name: 'Storage' })).toBeVisible()
        await page.getByRole('button', { name: 'Next' }).click();

        await expect(page.getByRole('heading', { name: 'Create' })).toBeVisible()
        await page.getByRole('button', { name: 'Dry run' }).click();

        await expect(page.getByText('Request would have succeeded, but DryRun flag is set.')).toBeVisible()
      });
    });
  });
});