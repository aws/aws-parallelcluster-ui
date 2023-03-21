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

import {ListClusterLogEvents} from '../model'
import {LogEvent, LogEventsResponse} from '../types/logs'

const mockGet = jest.fn()

jest.mock('axios', () => ({
  create: () => ({
    get: (...args: unknown[]) => mockGet(...args),
  }),
}))

describe('given a ListClusterLogEvents command and a cluster name', () => {
  const clusterName = 'any-name'
  const logStreamName = 'any-name'

  describe('when the log events can be retrieved successfully', () => {
    beforeEach(() => {
      const mockResponse: LogEventsResponse = {
        events: [
          {
            message: 'some-message',
            timestamp: 'some-timestamp',
          },
        ],
      }

      mockGet.mockResolvedValueOnce({data: mockResponse})
    })

    it('should return the log events list', async () => {
      const data = await ListClusterLogEvents(clusterName, logStreamName)

      expect(data).toEqual<LogEvent[]>([
        {
          message: 'some-message',
          timestamp: 'some-timestamp',
        },
      ])
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
        await ListClusterLogEvents(clusterName, logStreamName)
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
