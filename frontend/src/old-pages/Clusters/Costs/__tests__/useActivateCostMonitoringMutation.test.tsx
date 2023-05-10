// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
// with the License. A copy of the License is located at
//
// http://aws.amazon.com/apache2.0/
//
// or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
// limitations under the License.

import {renderHook, waitFor} from '@testing-library/react'
import {PropsWithChildren} from 'react'
import {I18nextProvider, initReactI18next} from 'react-i18next'
import {QueryClient, QueryClientProvider} from 'react-query'
import i18n from '../../../../i18n'
import {useActivateCostMonitoringMutation} from '../costs.queries'

i18n.use(initReactI18next).init({
  resources: {},
  lng: 'en',
})

const mockQueryClient = new QueryClient({
  defaultOptions: {queries: {retry: false}},
})
const wrapper: React.FC<PropsWithChildren<any>> = ({children}) => (
  <QueryClientProvider client={mockQueryClient}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </QueryClientProvider>
)

const mockActivateCostMonitoring = jest.fn()

jest.mock('../../../../model', () => ({
  ActivateCostMonitoring: () => mockActivateCostMonitoring(),
}))

describe('given a mutation to activate cost monitoring', () => {
  let mockOnSuccess: jest.Mock
  let mockOnError: jest.Mock

  beforeEach(() => {
    mockActivateCostMonitoring.mockClear()
    mockOnSuccess = jest.fn()
    mockOnError = jest.fn()
  })

  describe('when cost monitoring can be activated successfully', () => {
    beforeEach(() => {
      mockActivateCostMonitoring.mockResolvedValue(undefined)
    })

    it('should set the cost monitoring status to true', async () => {
      const {result} = renderHook(
        () => useActivateCostMonitoringMutation(mockOnError, mockOnSuccess),
        {wrapper},
      )

      result.current.mutate()

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockQueryClient.getQueryData(['COST_MONITORING_STATUS'])).toBe(
        true,
      )
    })

    it('should notify the user about the success', async () => {
      const {result} = renderHook(
        () => useActivateCostMonitoringMutation(mockOnError, mockOnSuccess),
        {wrapper},
      )

      result.current.mutate()

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockOnSuccess).toHaveBeenCalledTimes(1)
    })
  })

  describe('when cost monitoring activation fails', () => {
    describe('when cost explorer has not been manually enabled by the user', () => {
      beforeEach(() => {
        mockActivateCostMonitoring.mockRejectedValue({response: {status: 405}})
      })

      it('should notify the user about the failure', async () => {
        const {result} = renderHook(
          () => useActivateCostMonitoringMutation(mockOnError, mockOnSuccess),
          {wrapper},
        )

        result.current.mutate()

        await waitFor(() => expect(mockOnError).toHaveBeenCalledTimes(1))
        await waitFor(() =>
          expect(mockOnError).toHaveBeenCalledWith(
            'costExplorerCannotBeAccessed',
          ),
        )
      })
    })

    describe('when the request failed for any other reason', () => {
      beforeEach(() => {
        mockActivateCostMonitoring.mockRejectedValue({
          response: {status: 400, data: {message: 'some-error-message'}},
        })
      })

      it('should notify the user about the failure', async () => {
        const {result} = renderHook(
          () => useActivateCostMonitoringMutation(mockOnError, mockOnSuccess),
          {wrapper},
        )

        result.current.mutate()

        await waitFor(() => expect(mockOnError).toHaveBeenCalledTimes(1))
        await waitFor(() =>
          expect(mockOnError).toHaveBeenCalledWith(
            'genericError',
            'some-error-message',
          ),
        )
      })
    })
  })
})
