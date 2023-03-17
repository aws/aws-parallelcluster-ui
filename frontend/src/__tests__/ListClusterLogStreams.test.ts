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

import {mock} from 'jest-mock-extended'
import {ListClusterLogStreams} from '../model'
import {LogStream, LogStreamsResponse, LogStreamView} from '../types/logs'

const mockGet = jest.fn()

jest.mock('axios', () => ({
  create: () => ({
    get: (...args: unknown[]) => mockGet(...args),
  }),
}))

describe('given a ListClusterLogStreams command and a cluster name', () => {
  const clusterName = 'any-name'

  describe('when the log streams can be retrieved successfully', () => {
    beforeEach(() => {
      const mockResponse: LogStreamsResponse = {
        logStreams: [
          mock<LogStream>({
            logStreamName: 'hostname.instanceId.logIdentifier',
            lastEventTimestamp: 'some-timestamp',
          }),
        ],
      }

      mockGet.mockResolvedValueOnce({data: mockResponse})
    })

    it('should return the log streams list', async () => {
      const data = await ListClusterLogStreams(clusterName)

      expect(data).toEqual<LogStreamView[]>([
        {
          logStreamName: 'hostname.instanceId.logIdentifier',
          hostname: 'hostname',
          instanceId: 'instanceId',
          logIdentifier: 'logIdentifier',
          lastEventTimestamp: 'some-timestamp',
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
        await ListClusterLogStreams(clusterName)
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
