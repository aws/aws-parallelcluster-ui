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

import {GetCostMonitoringStatus} from '../model'
import {
  CostMonitoringStatus,
  CostMonitoringStatusResponse,
} from '../old-pages/Clusters/Costs/costs.types'

const mockGet = jest.fn()

jest.mock('axios', () => ({
  create: () => ({
    get: (...args: unknown[]) => mockGet(...args),
  }),
}))

describe('given a GetCostMonitoringStatus command', () => {
  describe('when the status can be retrieved successfully', () => {
    beforeEach(() => {
      const mockResponse: CostMonitoringStatusResponse = {
        active: true,
      }

      mockGet.mockResolvedValueOnce({data: mockResponse})
    })

    it('should request the status', async () => {
      await GetCostMonitoringStatus()

      expect(mockGet).toHaveBeenCalledTimes(1)
      expect(mockGet).toHaveBeenCalledWith(
        'cost-monitoring',
        expect.any(Object),
      )
    })

    it('should return the status', async () => {
      const data = await GetCostMonitoringStatus()

      expect(data).toEqual<CostMonitoringStatus>(true)
    })
  })

  describe('when the call fails', () => {
    let mockError: any

    beforeEach(() => {
      mockError = {
        response: {
          data: {
            message: 'some-error-messasge',
          },
        },
      }

      mockGet.mockRejectedValueOnce(mockError)
    })

    it('should re-throw the error', async () => {
      try {
        await GetCostMonitoringStatus()
      } catch (e) {
        expect(e).toEqual({
          response: {
            data: {
              message: 'some-error-messasge',
            },
          },
        })
      }
    })
  })
})
