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

import {render, RenderResult} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {I18nextProvider} from 'react-i18next'
import {QueryClient, QueryClientProvider} from 'react-query'
import {Provider} from 'react-redux'
import {BrowserRouter} from 'react-router-dom'
import i18n from '../../../i18n'
import {store} from '../../../store'
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
  },
]

const MockProviders = (props: any) => (
  <QueryClientProvider client={queryClient}>
    <I18nextProvider i18n={i18n}>
      <Provider store={store}>
        <BrowserRouter>{props.children}</BrowserRouter>
      </Provider>
    </I18nextProvider>
  </QueryClientProvider>
)

const mockListClusterLogStreams = jest.fn()

jest.mock('../../../model', () => ({
  ListClusterLogStreams: () => mockListClusterLogStreams(),
}))

jest.mock('../../../store', () => ({
  ...(jest.requireActual('../../../store') as any),
  setState: jest.fn(),
}))

describe('given a component to show the log streams list and a cluster name', () => {
  let mockOnLogStreamSelect: jest.Mock
  let screen: RenderResult

  const clusterName = 'some-name'

  beforeEach(() => {
    mockOnLogStreamSelect = jest.fn()

    mockListClusterLogStreams.mockResolvedValueOnce(mockLogStreams)

    screen = render(
      <MockProviders>
        <LogStreamsTable
          clusterName={clusterName}
          onLogStreamSelect={mockOnLogStreamSelect}
        />
      </MockProviders>,
    )
  })

  describe('when the log streams list is available', () => {
    describe('when the user selects a log stream', () => {
      it('should call the selection handler with the selected log stream name', async () => {
        await userEvent.click(screen.getByRole('radio'))
        expect(mockOnLogStreamSelect).toHaveBeenCalledTimes(1)
        expect(mockOnLogStreamSelect).toHaveBeenCalledWith(
          'hostname.instanceId.logIdentifier',
        )
      })
    })
  })
})
