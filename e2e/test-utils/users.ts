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

export function generateUserEmail() {
  return `user${Math.random().toString(20).substring(2, 8)}@${Math.random().toString(20).substring(2, 6)}.com`
}

export async function addUser(page: Page, email: string) {
  await page.getByRole('button', { name: 'Add user' }).first().click();
  await page.getByPlaceholder('email@domain.com').fill(email);
  await page.getByRole('button', { name: 'Add user' }).nth(1).click()
}

export async function deleteUser(page: Page, email: string) {
  await selectUser(page, email)
  await page.getByRole('button', { name: 'Remove' }).first().click();
  await page.getByRole('button', { name: 'Delete' }).first().click();
}

export async function selectUser(page: Page, email: string) {
  await page.getByRole('row', { name: email }).getByRole('radio').click();
}

export async function findUser(page: Page, email: string) {
  await page.getByPlaceholder('Find users').click();
  await page.getByPlaceholder('Find users').fill(email);
}

/**
 * Waits until the given user is listed, refreshing the list if needed:
 * the list loaded when opening the page may complete after the user is created and not include it.
 */
export async function waitForUserListed(page: Page, email: string) {
  await expect(async () => {
    await page.getByRole('button', { name: 'Refresh' }).click();
    await findUser(page, email);
    await expect(page.getByRole('row', { name: email })).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 30000 });
}
