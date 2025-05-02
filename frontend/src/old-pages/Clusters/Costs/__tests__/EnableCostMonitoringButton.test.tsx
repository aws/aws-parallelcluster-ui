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

import {fireEvent, render, RenderResult, waitFor} from '@testing-library/react'
import {I18nextProvider, initReactI18next} from 'react-i18next'
import {QueryClient, QueryClientProvider} from 'react-query'
import i18n from '../../../../i18n'
import {EnableCostMonitoringButton} from '../EnableCostMonitoringButton'
import {Store} from '@reduxjs/toolkit'
import {mock} from 'jest-mock-extended'
import {Provider} from 'react-redux'
import {COST_MONITORING_STATUS_QUERY_KEY} from '../costs.queries'

i18n.use(initReactI18next).init({
  resources: {},
  lng: 'en',
})

const queryClient = new QueryClient()
const mockStore = mock<Store>()

const MockProviders = (props: any) => (
  <QueryClientProvider client={queryClient}>
    <I18nextProvider i18n={i18n}>
      <Provider store={mockStore}>{props.children}</Provider>
    </I18nextProvider>
  </QueryClientProvider>
)
const mockGetCostMonitoringStatus = jest.fn()
const mockActivateCostMonitoring = jest.fn()

jest.mock('../../../../model', () => {
  const originalModule = jest.requireActual('../../../../model')

  return {
    __esModule: true,
    ...originalModule,
    GetCostMonitoringStatus: () => mockGetCostMonitoringStatus(),
    ActivateCostMonitoring: () => mockActivateCostMonitoring(),
  }
})

describe('given a component to activate cost monitoring for the account', () => {
  let screen: RenderResult

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when PC version is at least 3.2.0', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        app: {
          wizard: {version: '3.2.0'},
        },
        aws: {
          region: 'us-west-1',
        },
      })

      screen = render(
        <MockProviders>
          <EnableCostMonitoringButton />
        </MockProviders>,
      )
    })

    it('should request the cost monitoring status', async () => {
      expect(mockGetCostMonitoringStatus).toHaveBeenCalledTimes(1)
    })

    describe('when user tries to activate cost monitoring', () => {
      beforeEach(async () => {
        await waitFor(() => fireEvent.click(screen.getByRole('button')))
      })

      it('should request the cost monitoring activation', () => {
        expect(mockActivateCostMonitoring).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('when cost monitoring is already active for the account', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        app: {
          wizard: {version: '3.2.0'},
        },
        aws: {
          region: 'us-west-1',
        },
      })
      mockGetCostMonitoringStatus.mockResolvedValue(true)

      screen = render(
        <MockProviders>
          <EnableCostMonitoringButton />
        </MockProviders>,
      )
    })

    it('should not render the button', async () => {
      await waitFor(() =>
        expect(
          queryClient.getQueryState(COST_MONITORING_STATUS_QUERY_KEY)?.status,
        ).toBe('success'),
      )
      expect(screen.queryByRole('button')).toBeNull()
    })
  })

  describe('when PC version is less than 3.2.0', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        app: {
          wizard: {version: '3.1.5'},
        },
        aws: {
          region: 'us-west-1',
        },
      })

      screen = render(
        <MockProviders>
          <EnableCostMonitoringButton />
        </MockProviders>,
      )
    })

    it('should not request the cost monitoring status', async () => {
      expect(mockGetCostMonitoringStatus).toHaveBeenCalledTimes(0)
    })

    it('should not render the button', () => {
      expect(screen.queryByRole('button')).toBeNull()
    })
  })
})
