// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
// with the License. A copy of the License is located at
//
// http://aws.amazon.com/apache2.0/
//
// or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
// limitations under the License.

import { test } from '@playwright/test';
import { visitAndLogin } from '../test-utils/login';
import { fillClusterSection, fillHeadNodeSection, fillQueuesSection, fillStorageSection, performDryRun } from '../test-utils/wizard';

const CLUSTER_TO_COPY_FROM = 'DO-NOT-DELETE'

test.describe('environment: @demo', () => {
  test.describe('given an already existing cluster', () => {
    test.describe('when the cluster is picked as source to start the creation wizard', () => {
      test('user can perform a dry-run successfully', async ({ page }) => {
        await visitAndLogin(page)

        await page.getByRole('button', { name: 'Create cluster' }).first().click();
        await page.getByRole('menuitem', { name: 'From another cluster' }).click();

        await page.getByRole('button', { name: 'Select a cluster' }).click();
        await page.getByRole('option', { name: CLUSTER_TO_COPY_FROM }).click();
        await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click();

        await fillClusterSection(page, false)

        await fillHeadNodeSection(page)

        await fillQueuesSection(page)

        await fillStorageSection(page)

        await performDryRun(page)
      });
    })
  })