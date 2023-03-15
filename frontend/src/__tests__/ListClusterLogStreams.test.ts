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

      expect(data).toEqual([
        {
          hostname: 'hostname',
          instanceId: 'instanceId',
          logIdentifier: 'logIdentifier',
          lastEventTimestamp: 'some-timestamp',
        },
      ] as LogStreamView[])
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
