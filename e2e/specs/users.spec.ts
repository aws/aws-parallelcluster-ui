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
import { addUser, deleteUser, findUser, generateUserEmail, selectUser } from '../test-utils/users';
import { LOGIN_CONFIG } from '../configs/login';

test.describe('Given an endpoint where AWS ParallelCluster UI is deployed', () => {
  test.describe('when the user navigates to the Users page', () => {
    test.beforeEach(async ({ page }) => {
      await visitAndLogin(page)
      await page.getByRole('link', { name: 'Users' }). click();
    });

    test('the user can add a new PCUI user with a valid email', async ({ page }) => {
      const email = generateUserEmail()
      await addUser(page, email)
      await findUser(page, email)
      await expect(page.getByText(email)).toBeVisible()
      await deleteUser(page, email)
    });

    test('the user cannot add a new PCUI user with an invalid email', async ({ page }) => {
      await addUser(page, "user@invalid")
      await expect(page.getByText("You must enter a valid email")).toBeVisible()
    });

    test('the user can delete an existing user', async ({ page }) => {
      const email = "to-be-deleted@test.com"
      await addUser(page, email)
      await findUser(page, email)
      await deleteUser(page, email)
      await expect(page.getByText("No users match the filters.")).toBeVisible()
    });

    test('the user cannot delete itself', async ({ page }) => {
      await findUser(page, LOGIN_CONFIG.username)
      await selectUser(page, LOGIN_CONFIG.username)
      await expect(page.getByRole('button', { name: 'Remove' }).first()).toBeDisabled()
    });
  })
})
