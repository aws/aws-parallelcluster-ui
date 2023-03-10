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

test.describe('Given an endpoint where AWS ParallelCluster UI is deployed', () => {
  test('a user should be able to login, navigate till the end of the cluster creation wizard, and perform a dry-run successfully', async ({ page }) => {
    await visitAndLogin(page)
  
    await page.getByRole('button', { name: 'Create cluster' }).first().click();
    await page.getByRole('menuitem', { name: 'Use interface' }).click();
    
    await fillClusterSection(page)
    
    await fillHeadNodeSection(page)
  
    await fillQueuesSection(page)

    await fillStorageSection(page)
  
    await performDryRun(page)
  });
})
