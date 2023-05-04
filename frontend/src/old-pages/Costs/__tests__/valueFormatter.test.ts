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

import {toShortDollarAmount} from '../valueFormatter'

describe('toShortDollarAmount', () => {
  test('returns correct value for input >= 1e9', () => {
    const result = toShortDollarAmount(1500000000)
    expect(result).toEqual('1.5G')
  })

  test('returns correct value for input >= 1e6', () => {
    const result = toShortDollarAmount(2000000)
    expect(result).toEqual('2.0M')
  })

  test('returns correct value for input >= 1e3', () => {
    const result = toShortDollarAmount(5000)
    expect(result).toEqual('5.0K')
  })

  test('returns correct value for input < 1e3', () => {
    const result = toShortDollarAmount(123.456)
    expect(result).toEqual('123.46')
  })

  test('returns correct value for negative input', () => {
    const result = toShortDollarAmount(-1234567890)
    expect(result).toEqual('-1.2G')
  })
})
