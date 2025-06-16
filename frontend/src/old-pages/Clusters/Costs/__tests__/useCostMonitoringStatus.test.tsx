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
import {mock} from 'jest-mock-extended'
import {Store} from '@reduxjs/toolkit'
import {Provider} from 'react-redux'
import {GetCostMonitoringStatus} from "../../../../model";

const mockQueryClient = new QueryClient({
  defaultOptions: {queries: {retry: false}},
})
const mockStore = mock<Store>()
const wrapper: React.FC<PropsWithChildren<any>> = ({children}) => (
  <QueryClientProvider client={mockQueryClient}>
    <Provider store={mockStore}>{children}</Provider>
  </QueryClientProvider>
)

const mockGetCostMonitoringStatus = jest.fn()

const mockUseState = jest.fn()
const mockSetState = jest.fn()

jest.mock('../../../../store', () => ({
  ...(jest.requireActual('../../../../store') as any),
  setState: (...args: unknown[]) => mockSetState(...args),
  useState: (...args: unknown[]) => mockUseState(...args),
}))

jest.mock('../../../../model', () => {
  const originalModule = jest.requireActual('../../../../model')

  return {
    __esModule: true,
    ...originalModule,
    GetCostMonitoringStatus: () => mockGetCostMonitoringStatus(),
  }
})

describe('given a hook to get the cost monitoring status', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockQueryClient.resetQueries()
  })

  describe('when PC version is at least 3.2.0', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        app: {
          version: {full: ['3.2.0', '3.1.5']},
        },
        aws: {
          region: 'us-west-1',
        },
      })
      mockUseState.mockReturnValue('3.2.0')
    })

    it('should request the cost monitoring status', async () => {
      renderHook(() => useCostMonitoringStatus(), {wrapper})

      expect(mockGetCostMonitoringStatus).toHaveBeenCalledTimes(1)
    })
  })

  describe('when PC version is less than 3.2.0', () => {
    beforeEach(() => {
      mockUseState.mockReturnValue('3.1.5')
    })

    it('should not request the cost monitoring status', async () => {
      renderHook(() => useCostMonitoringStatus(), {wrapper})

      expect(mockGetCostMonitoringStatus).toHaveBeenCalledTimes(0)
    })
  })

  describe('when PC version is at least 3.2.0, and the region is us-gov-west-1', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        app: {
          wizard: {version: '3.2.0'},
        },
        aws: {
          region: 'us-gov-west-1',
        },
      })
    })
    it('should not request the cost monitoring status', async () => {
      renderHook(() => useCostMonitoringStatus(), {wrapper})

      expect(mockGetCostMonitoringStatus).toHaveBeenCalledTimes(0)
    })
  })
})
