import {ListClusters} from '../model'
import {ClusterInfoSummary, ClusterStatus} from '../types/clusters'
import {CloudFormationStackStatus} from '../types/base'

const mockCluster1: ClusterInfoSummary = {
  clusterName: 'test-cluster-1',
  clusterStatus: ClusterStatus.CreateComplete,
  version: '3.8.0',
  cloudformationStackArn: 'arn',
  region: 'region',
  cloudformationStackStatus: CloudFormationStackStatus.CreateComplete,
}

const mockCluster2: ClusterInfoSummary = {
  clusterName: 'test-cluster-2',
  clusterStatus: ClusterStatus.CreateComplete,
  version: '3.9.0',
  cloudformationStackArn: 'arn',
  region: 'region',
  cloudformationStackStatus: CloudFormationStackStatus.CreateComplete,
}

const mockGet = jest.fn()

jest.mock('axios', () => ({
  get: (...args: unknown[]) => mockGet(...args),
  create: (...args: unknown[]) => jest.fn(),
}))

describe('given a ListClusters command', () => {
  describe('when the clusters use pagination to be listed', () => {
    beforeEach(() => {
      const mockResponse1 = {
        nextToken: 'asdfghjkl',
        clusters: [mockCluster1],
      }

      const mockResponse2 = {
        clusters: [mockCluster2],
      }
      mockGet
        .mockResolvedValueOnce({data: mockResponse1})
        .mockResolvedValueOnce({data: mockResponse2})
    })

    it('should return the list of all clusters', async () => {
      const data = await ListClusters()
      expect(data).toEqual([mockCluster1, mockCluster2])
    })
  })

  describe('when the clusters are listed in one API call', () => {
    beforeEach(() => {
      const mockResponse1 = {
        clusters: [mockCluster1, mockCluster2],
      }
      mockGet.mockResolvedValueOnce({data: mockResponse1})
    })

    it('should return the list of all clusters', async () => {
      const data = await ListClusters()
      expect(data).toEqual([mockCluster1, mockCluster2])
    })
  })

  describe('when there are no clusters', () => {
    beforeEach(() => {
      const mockResponse1 = {
        clusters: [],
      }
      mockGet.mockResolvedValueOnce({data: mockResponse1})
    })

    it('should return empty list', async () => {
      const data = await ListClusters()
      expect(data).toEqual([])
    })
  })

  describe('when the list cluster fails', () => {
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

    it('should throw the error', async () => {
      try {
        await ListClusters()
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
