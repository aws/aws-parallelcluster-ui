// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
// with the License. A copy of the License is located at
//
// http://aws.amazon.com/apache2.0/
//
// or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
// limitations under the License.

import { expect, test } from '@playwright/test';
import { visitAndLogin } from '../test-utils/login';

test.describe('Given an endpoint where AWS ParallelCluster UI is deployed', () => {
  test.describe('when the user navigates to the Images page', () => {
    test('the user can switch between Official and Custom images sections', async ({ page }) => {
      await visitAndLogin(page)

      await page.getByRole('link', { name: 'Images' }).click();

      await page.getByRole('tab', { name: /Official/i }).click();
      await expect(page.getByRole('heading', { name: /Official images/ })).toBeVisible()

      await page.getByRole('tab', { name: /Custom/i }).click();
      await expect(page.getByRole('heading', { name: /Custom images/ })).toBeVisible()
    });
  })
})
