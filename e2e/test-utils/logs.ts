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

const NON_ZERO_MESSAGES_COUNT = /Messages.*\([1-9][0-9]*\+\)/

export async function visitClusterLogsPage(page: Page) {
  await expect(page.getByRole('heading', { name: 'Cluster DO-NOT-DELETE logs', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Log streams' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible()

  const logStreamsFilter = page.getByPlaceholder('Filter log streams')
  await logStreamsFilter.click();
  await logStreamsFilter.fill('clusterstatusmgtd');
  await logStreamsFilter.press('Enter');

  await page.getByRole('row', { name: 'clusterstatusmgtd' })
    .getByRole('radio')
    .click();

  await expect(page.getByRole('heading', { name: NON_ZERO_MESSAGES_COUNT })).toBeVisible()
}