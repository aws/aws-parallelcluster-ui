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

import {Store} from '@reduxjs/toolkit'
import {render, RenderResult} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {mock} from 'jest-mock-extended'
import {I18nextProvider, initReactI18next} from 'react-i18next'
import {QueryClient, QueryClientProvider} from 'react-query'
import {Provider} from 'react-redux'
import {BrowserRouter} from 'react-router-dom'
import i18n from '../../../i18n'
import {ClusterDescription} from '../../../types/clusters'
import {LogStreamView} from '../../../types/logs'
import {LogStreamsTable} from '../LogStreamsTable'

const queryClient = new QueryClient()
const mockLogStreams: LogStreamView[] = [
  {
    logStreamName: 'hostname.instanceId.logIdentifier',
    hostname: 'hostname',
    instanceId: 'instanceId',
    logIdentifier: 'logIdentifier',
    lastEventTimestamp: '2023-03-10T08:45:17.133Z',
    nodeType: null,
  },
]
const mockClusterInfo = mock<ClusterDescription>({
  headNode: {
    instanceId: 'instanceId',
  },
})

i18n.use(initReactI18next).init({
  resources: {},
  lng: 'en',
})

const mockStore = mock<Store>()

const MockProviders = (props: any) => (
  <QueryClientProvider client={queryClient}>
    <I18nextProvider i18n={i18n}>
      <Provider store={mockStore}>
        <BrowserRouter>{props.children}</BrowserRouter>
      </Provider>
    </I18nextProvider>
  </QueryClientProvider>
)

const mockListClusterLogStreams = jest.fn()
const mockDescribeCluster = jest.fn()

jest.mock('../../../model', () => ({
  ListClusterLogStreams: () => mockListClusterLogStreams(),
  DescribeCluster: () => mockDescribeCluster(),
}))

jest.mock('../../../store', () => ({
  ...(jest.requireActual('../../../store') as any),
  setState: jest.fn(),
}))

describe('given a component to show the log streams list and a cluster name', () => {
  let mockOnLogStreamSelect: jest.Mock
  let screen: RenderResult

  const clusterName = 'someClusterName'

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnLogStreamSelect = jest.fn()
  })

  describe('when the headnode description is not available', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        clusters: {index: {someClusterName: null}},
      })

      screen = render(
        <MockProviders>
          <LogStreamsTable
            clusterName={clusterName}
            onLogStreamSelect={mockOnLogStreamSelect}
          />
        </MockProviders>,
      )
    })

    it('should request the cluster description', () => {
      expect(mockDescribeCluster).toHaveBeenCalledTimes(1)
    })

    it('should request the cluster log streams', () => {
      expect(mockListClusterLogStreams).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the headnode description is available', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        clusters: {index: {someClusterName: mockClusterInfo}},
      })

      screen = render(
        <MockProviders>
          <LogStreamsTable
            clusterName={clusterName}
            onLogStreamSelect={mockOnLogStreamSelect}
          />
        </MockProviders>,
      )
    })

    it('should not request the cluster description', () => {
      expect(mockDescribeCluster).not.toHaveBeenCalledTimes(1)
    })

    it('should request the cluster log streams', () => {
      expect(mockListClusterLogStreams).toHaveBeenCalledTimes(1)
    })
  })

  describe('when both the headnode and the log streams list are available', () => {
    beforeEach(() => {
      mockListClusterLogStreams.mockResolvedValue(mockLogStreams)
      mockDescribeCluster.mockResolvedValue(mockClusterInfo)

      screen = render(
        <MockProviders>
          <LogStreamsTable
            clusterName={clusterName}
            onLogStreamSelect={mockOnLogStreamSelect}
          />
        </MockProviders>,
      )
    })

    describe('when the user selects a log stream', () => {
      it('should call the selection handler with the selected log stream name', async () => {
        await userEvent.click(screen.getByRole('radio'))
        expect(mockOnLogStreamSelect).toHaveBeenCalledTimes(1)
        expect(mockOnLogStreamSelect).toHaveBeenCalledWith(
          'hostname.instanceId.logIdentifier',
        )
      })
    })

    describe('when the user refreshes the list', () => {
      it('should refetch the log streams', async () => {
        await userEvent.click(
          screen.getByRole('button', {
            name: 'clusterLogs.logEvents.actions.refresh',
          }),
        )
        expect(mockListClusterLogStreams).toHaveBeenCalledTimes(2)
      })
    })
  })
})
