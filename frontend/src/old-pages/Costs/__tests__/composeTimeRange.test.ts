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

import {composeTimeRange} from '../composeTimeRange'
import tzmock from 'timezone-mock'

describe('given a function to generate a time range for the last 12 months', () => {
  beforeEach(() => {
    tzmock.register('UTC')
  })

  afterEach(() => {
    tzmock.unregister()
  })

  describe('given a date', () => {
    let mockDate: Date

    beforeEach(() => {
      mockDate = new Date('2023-04-21T12:11:15Z')
    })

    it('returns the given date in ISO string', () => {
      expect(composeTimeRange(mockDate).toDate).toBe('2023-04-21T00:00:00.000Z')
    })

    it('returns the date of 12 months earlier in ISO string', () => {
      expect(composeTimeRange(mockDate).fromDate).toBe(
        '2022-04-21T00:00:00.000Z',
      )
    })
  })
})
