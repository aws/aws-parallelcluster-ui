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

import {GetVersion} from '../model'
import {setState} from '../store'
import {PCVersion} from '../types/base'

const mockGet = jest.fn()

jest.mock('axios', () => ({
  create: () => ({
    get: (...args: unknown[]) => mockGet(...args),
  }),
}))

jest.mock('../store', () => ({
  ...(jest.requireActual('../store') as any),
  setState: jest.fn(),
}))

describe('given a GetVersion command', () => {
  describe('when the PC version can be retrieved successfully', () => {
    beforeEach(() => {
      const mockResponse = {
        version: '3.5.0',
      }

      mockGet.mockResolvedValueOnce({data: mockResponse})
    })

    it('should return the PC version', async () => {
      const data = await GetVersion()

      expect(data).toEqual<PCVersion>({full: '3.5.0'})
    })

    it('should store the PC version', async () => {
      await GetVersion()

      expect(setState).toHaveBeenCalledWith(['app', 'version'], {full: '3.5.0'})
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
        await GetVersion()
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
