// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
// with the License. A copy of the License is located at
//
// http://aws.amazon.com/apache2.0/
//
// or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
// limitations under the License.

import { ENVIRONMENT_CONFIG } from './configs/environment';

const ENDPOINT_CHECK_TIMEOUT_MS = 30 * 1000;

/**
 * Fails the whole run fast when the endpoint under test is not responsive,
 * instead of letting every test fail on navigation and be retried.
 */
async function globalSetup() {
  const url = ENVIRONMENT_CONFIG.URL;
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(ENDPOINT_CHECK_TIMEOUT_MS) });
  } catch (error) {
    const cause = (error as Error & { cause?: unknown }).cause ?? error;
    throw new Error(`PCUI endpoint ${url} is unreachable: ${cause}`);
  }
  if (!response.ok) {
    throw new Error(`PCUI endpoint ${url} is not responsive: HTTP ${response.status} ${response.statusText}`);
  }
}

export default globalSetup;
