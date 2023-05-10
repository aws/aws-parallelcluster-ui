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

import {GetCostMonitoringData} from '../model'
import {
  CostMonitoringData,
  CostMonitoringDataResponse,
} from '../old-pages/Clusters/Costs/costs.types'

const mockGet = jest.fn()

jest.mock('axios', () => ({
  create: () => ({
    get: (...args: unknown[]) => mockGet(...args),
  }),
}))

describe('given a GetCostMonitoringData command', () => {
  const mockClusterName = 'some-cluster-name'
  const mockStartDate = 'some-start-date'
  const mockEndDate = 'some-end-date'
  const mockResponse: CostMonitoringDataResponse = {
    costs: [
      {
        amount: 10,
        period: {
          start: 'some-start',
          end: 'some-end',
        },
        unit: 'USD',
      },
    ],
  }

  describe('when the data can be retrieved successfully', () => {
    beforeEach(() => {
      mockGet.mockResolvedValueOnce({data: mockResponse})
    })

    it('should request the status', async () => {
      await GetCostMonitoringData(mockClusterName, mockStartDate, mockEndDate)

      expect(mockGet).toHaveBeenCalledTimes(1)
      expect(mockGet).toHaveBeenCalledWith(
        'cost-monitoring/clusters/some-cluster-name?start=some-start-date&end=some-end-date',
        expect.any(Object),
      )
    })

    it('should return the status', async () => {
      const data = await GetCostMonitoringData(
        mockClusterName,
        mockStartDate,
        mockEndDate,
      )

      expect(data).toEqual<CostMonitoringData[]>(mockResponse.costs)
    })
  })

  describe('when the call fails', () => {
    let mockError: any

    beforeEach(() => {
      mockError = {
        response: {
          data: {
            message: 'some-error-message',
          },
        },
      }

      mockGet.mockRejectedValueOnce(mockError)
    })

    it('should re-throw the error', async () => {
      try {
        await GetCostMonitoringData(mockClusterName, mockStartDate, mockEndDate)
      } catch (e) {
        expect(e).toEqual({
          response: {
            data: {
              message: 'some-error-message',
            },
          },
        })
      }
    })
  })
})
