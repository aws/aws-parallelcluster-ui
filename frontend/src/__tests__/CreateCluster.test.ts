import {CreateCluster} from '../model'

jest.mock('../http/executeRequest', () => ({
  executeRequest: jest.fn(),
}))
import {executeRequest} from '../http/executeRequest'
const mockRequest = executeRequest as jest.Mock

describe('given a CreateCluster command and a cluster configuration', () => {
  const clusterName = 'any-name'
  const clusterConfiguration = 'Imds:\n  ImdsSupport: v2.0'
  const mockRegion = 'some-region'
  const mockSelectedRegion = 'some-region'

  describe('when the cluster can be created successfully', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      const mockResponse = {
        status: 202,
        data: {
          some: 'data',
        },
      }
      mockRequest.mockResolvedValueOnce(mockResponse)
    })

    it('should emit the API request', async () => {
      const expectedBody = {
        clusterConfiguration: expect.stringContaining(
          'Imds:\n  ImdsSupport: v2.0',
        ),
        clusterName,
      }

      await CreateCluster(
        clusterName,
        clusterConfiguration,
        mockRegion,
        mockSelectedRegion,
      )
      expect(mockRequest).toHaveBeenCalledTimes(1)
      expect(mockRequest).toHaveBeenCalledWith(
        'post',
        'api?path=/v3/clusters&region=some-region',
        expectedBody,
        expect.any(Object),
        expect.any(Object),
      )
    })

    it('should call the success callback', async () => {
      const mockSuccessCallback = jest.fn()
      await CreateCluster(
        clusterName,
        clusterConfiguration,
        mockRegion,
        mockSelectedRegion,
        false,
        mockSuccessCallback,
      )
      expect(mockSuccessCallback).toHaveBeenCalledTimes(1)
      expect(mockSuccessCallback).toHaveBeenCalledWith({some: 'data'})
    })

    describe('when a dryrun is requested', () => {
      const mockDryRun = true

      it('should add set the dryrun query parameter', async () => {
        await CreateCluster(
          clusterName,
          clusterConfiguration,
          mockRegion,
          mockSelectedRegion,
          mockDryRun,
        )
        expect(mockRequest).toHaveBeenCalledTimes(1)
        expect(mockRequest).toHaveBeenCalledWith(
          'post',
          'api?path=/v3/clusters&dryrun=true&region=some-region',
          expect.any(Object),
          expect.any(Object),
          expect.any(Object),
        )
      })
    })
  })

  describe('when the cluster creation fails', () => {
    let mockError: any

    beforeEach(() => {
      mockError = {
        response: {
          data: {
            message: 'some-error-message',
          },
        },
      }
      mockRequest.mockRejectedValueOnce(mockError)
    })

    it('should call the error callback', async () => {
      const mockErrorCallback = jest.fn()
      await CreateCluster(
        clusterName,
        clusterConfiguration,
        mockRegion,
        mockSelectedRegion,
        false,
        undefined,
        mockErrorCallback,
      )
      await Promise.resolve()
      expect(mockErrorCallback).toHaveBeenCalledTimes(1)
      expect(mockErrorCallback).toHaveBeenCalledWith({
        message: 'some-error-message',
      })
    })
  })

  describe('when it contains no custom tags', () => {
    beforeEach(() => {
      mockRequest.mockResolvedValueOnce({status: 202, data: {}})
    })
    it('should append a tag to specify the cluster has been created with the UI', () => {
      CreateCluster(
        clusterName,
        'Imds:\n  ImdsSupport: v2.0',
        mockRegion,
        mockSelectedRegion,
      )

      expect(mockRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          clusterConfiguration: expect.stringContaining(
            "Tags:\n  - Key: parallelcluster-ui\n    Value: 'true'",
          ),
        }),
        expect.anything(),
        null,
      )
    })
  })

  describe('when it contains existing tags', () => {
    beforeEach(() => {
      mockRequest.mockResolvedValueOnce({status: 202, data: {}})
    })
    it('should not remove any of the existing tags', () => {
      CreateCluster(
        clusterName,
        'Imds:\n  ImdsSupport: v2.0\nTags:\n  - Key: foo\n    Value: bar',
        mockRegion,
        mockSelectedRegion,
      )

      expect(mockRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          clusterConfiguration: expect.stringContaining(
            'Tags:\n  - Key: foo\n    Value: bar',
          ),
        }),
        expect.anything(),
        null,
      )
    })
  })

  describe('when it contains an existing PCUI tag', () => {
    beforeEach(() => {
      mockRequest.mockResolvedValueOnce({status: 202, data: {}})
    })
    it('should not duplicate the tag', () => {
      CreateCluster(
        clusterName,
        "Imds:\n  ImdsSupport: v2.0\nTags:\n  - Key: parallelcluster-ui\n    Value: 'true'",
        mockRegion,
        mockSelectedRegion,
      )

      expect(mockRequest).not.toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          clusterConfiguration: expect.stringContaining(
            "Tags:\n  - Key: parallelcluster-ui\n    Value: 'true'\n  - Key: parallelcluster-ui\n    Value: 'true'",
          ),
        }),
        expect.anything(),
        null,
      )
    })
  })
})
