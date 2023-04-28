// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
// with the License. A copy of the License is located at
//
// http://aws.amazon.com/apache2.0/
//
// or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
// limitations under the License.

import {renderHook} from '@testing-library/react'
import {PropsWithChildren} from 'react'
import {QueryClient, QueryClientProvider} from 'react-query'
import {useCostMonitoringStatus} from '../costs.queries'

const mockQueryClient = new QueryClient({
  defaultOptions: {queries: {retry: false}},
})
const wrapper: React.FC<PropsWithChildren<any>> = ({children}) => (
  <QueryClientProvider client={mockQueryClient}>{children}</QueryClientProvider>
)

const mockGetCostMonitoringStatus = jest.fn()
const mockUseCostMonitoringFeature = jest.fn()

jest.mock('../useCostMonitoringFeature', () => ({
  useCostMonitoringFeature: () => mockUseCostMonitoringFeature(),
}))

jest.mock('../../../model', () => {
  const originalModule = jest.requireActual('../../../model')

  return {
    __esModule: true,
    ...originalModule,
    GetCostMonitoringStatus: () => mockGetCostMonitoringStatus(),
  }
})

describe('given a hook to get the cost monitoring status', () => {
  beforeEach(() => {
    mockUseCostMonitoringFeature.mockClear()
    mockGetCostMonitoringStatus.mockClear()
  })

  describe('when the cost monitoring feature is enabled', () => {
    beforeEach(() => {
      mockUseCostMonitoringFeature.mockReturnValueOnce(true)
    })

    it('should request the cost monitoring status', async () => {
      renderHook(() => useCostMonitoringStatus(), {wrapper})

      expect(mockGetCostMonitoringStatus).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the cost monitoring feature is not enabled', () => {
    beforeEach(() => {
      mockUseCostMonitoringFeature.mockReturnValueOnce(false)
    })

    it('should not request the cost monitoring status', async () => {
      renderHook(() => useCostMonitoringStatus(), {wrapper})

      expect(mockGetCostMonitoringStatus).toHaveBeenCalledTimes(0)
    })
  })
})
