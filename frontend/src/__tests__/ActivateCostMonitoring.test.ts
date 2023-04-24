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

import {ActivateCostMonitoring} from '../model'

const mockRequest = jest.fn()

jest.mock('../http/executeRequest', () => ({
  executeRequest: (...args: unknown[]) => mockRequest(...args),
}))

describe('given a ActivateCostMonitoring command', () => {
  describe('when the action can be performed successfully', () => {
    beforeEach(() => {
      mockRequest.mockResolvedValueOnce(undefined)
    })

    it('should send an activation request', async () => {
      await ActivateCostMonitoring()

      expect(mockRequest).toHaveBeenCalledTimes(1)
      expect(mockRequest).toHaveBeenCalledWith(
        'put',
        'costs',
        undefined,
        expect.any(Object),
        expect.any(Object),
      )
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

      mockRequest.mockRejectedValueOnce(mockError)
    })

    it('should re-throw the error', async () => {
      try {
        await ActivateCostMonitoring()
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
