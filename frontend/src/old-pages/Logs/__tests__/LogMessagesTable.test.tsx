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
import {I18nextProvider, initReactI18next} from 'react-i18next'
import {QueryClient, QueryClientProvider} from 'react-query'
import {BrowserRouter} from 'react-router-dom'
import i18n from '../../../i18n'
import {LogEvent} from '../../../types/logs'
import {LogMessagesTable} from '../LogMessagesTable'

const queryClient = new QueryClient()
const mockLogEvents: LogEvent[] = [
  {
    message: 'some-message',
    timestamp: '2023-03-10T08:45:17.133Z',
  },
]

i18n.use(initReactI18next).init({
  resources: {},
  lng: 'en',
})

const MockProviders = (props: any) => (
  <QueryClientProvider client={queryClient}>
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>{props.children}</BrowserRouter>
    </I18nextProvider>
  </QueryClientProvider>
)

const mockListClusterLogEvents = jest.fn()

jest.mock('../../../model', () => ({
  ListClusterLogEvents: () => mockListClusterLogEvents(),
}))

describe('given a component to show the log events list, a cluster name and a log stream name', () => {
  let screen: RenderResult

  const clusterName = 'someClusterName'
  const logStreamName = 'someLogStreamName'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when the log stream name is not available', () => {
    beforeEach(() => {
      screen = render(
        <MockProviders>
          <LogMessagesTable
            clusterName={clusterName}
            logStreamName={undefined}
          />
        </MockProviders>,
      )
    })

    it('should not fetch the log events list', () => {
      expect(mockListClusterLogEvents).toHaveBeenCalledTimes(0)
    })

    it('should disable the refresh button', async () => {
      await userEvent.click(
        screen.getByRole('button', {
          name: 'clusterLogs.logEvents.actions.refresh',
        }),
      )
      expect(mockListClusterLogEvents).toHaveBeenCalledTimes(0)
    })
  })

  describe('when the log stream name is available', () => {
    describe('when the log events list is not available', () => {
      beforeEach(() => {
        screen = render(
          <MockProviders>
            <LogMessagesTable
              clusterName={clusterName}
              logStreamName={logStreamName}
            />
          </MockProviders>,
        )
      })

      it('should request the cluster log events', () => {
        expect(mockListClusterLogEvents).toHaveBeenCalledTimes(1)
      })
    })

    describe('when the log events list is available', () => {
      beforeEach(() => {
        mockListClusterLogEvents.mockResolvedValue(mockLogEvents)

        screen = render(
          <MockProviders>
            <LogMessagesTable
              clusterName={clusterName}
              logStreamName={logStreamName}
            />
          </MockProviders>,
        )
      })

      describe('when the user refreshes the list', () => {
        it('should refetch the log events', async () => {
          await userEvent.click(
            screen.getByRole('button', {
              name: 'clusterLogs.logEvents.actions.refresh',
            }),
          )
          expect(mockListClusterLogEvents).toHaveBeenCalledTimes(2)
        })
      })
    })
  })
})
