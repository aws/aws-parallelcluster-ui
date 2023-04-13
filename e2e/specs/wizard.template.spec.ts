// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
// with the License. A copy of the License is located at
//
// http://aws.amazon.com/apache2.0/
//
// or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
// limitations under the License.

import { FileChooser, test } from '@playwright/test';
import { visitAndLogin } from '../test-utils/login';
import { fillWizard } from '../test-utils/wizard';

const TEMPLATE_PATH = './fixtures/wizard.template.yaml'

test.describe('environment: @demo', () => {
  test.describe('given a cluster configuration template created with single instance type', () => {
    test.describe('when the file is imported as a template', () => {
      test('user can perform a dry-run successfully', async ({ page }) => {
        await visitAndLogin(page)

        await page.getByRole('button', { name: 'Create cluster' }).first().click();
        
        page.on("filechooser", (fileChooser: FileChooser) => {
          fileChooser.setFiles([TEMPLATE_PATH]);
        })
        await page.getByRole('menuitem', { name: 'With a template' }).click();
        
        await fillWizard(page)
      });
    });
  });
});