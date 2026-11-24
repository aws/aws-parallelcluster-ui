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

import {getDefaultOs} from '../defaultOs'

describe('given a function to get the default OS', () => {
  it.each([
    ['3.9.0', 'alinux2'],
    ['3.10.0', 'alinux2023'],
    ['3.15.0', 'alinux2023'],
    ['3.16.3', 'alinux2023'],
  ])('when the version is %s, it should return %s', (version, expectedOs) => {
    expect(getDefaultOs(version, 'eu-west-1')).toBe(expectedOs)
  })

  it('when the version is not set, it should return alinux2', () => {
    expect(getDefaultOs(undefined as unknown as string, 'eu-west-1')).toBe(
      'alinux2',
    )
  })
})
