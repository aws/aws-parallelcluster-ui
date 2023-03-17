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
import { ENVIRONMENT_CONFIG } from "../configs/environment";
import { LOGIN_CONFIG } from "../configs/login";

export async function visitAndLogin(page: Page) {
  await page.goto(ENVIRONMENT_CONFIG.URL);
  await page.getByRole('textbox', { name: 'name@host.com' }).fill(LOGIN_CONFIG.username);
  await page.getByRole('textbox', { name: 'Password' }).fill(LOGIN_CONFIG.password);
  await page.getByRole('button', { name: 'submit' }).click();
}