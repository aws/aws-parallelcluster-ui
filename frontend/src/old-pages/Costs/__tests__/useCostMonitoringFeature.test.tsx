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
import {renderHook} from '@testing-library/react'
import {mock} from 'jest-mock-extended'
import {PropsWithChildren} from 'react'
import {Provider} from 'react-redux'
import {useCostMonitoringFeature} from '../useCostMonitoringFeature'

const mockStore = mock<Store>()

const wrapper: React.FC<PropsWithChildren<any>> = ({children}) => (
  <Provider store={mockStore}>{children}</Provider>
)

describe('given a hook to get the status of the cost monitoring feature', () => {
  describe('when the experimental flag is enabled', () => {
    beforeEach(() => {
      window.sessionStorage.setItem('additionalFeatures', '["experimental"]')
    })

    describe('when the PC version supports cost monitoring', () => {
      beforeEach(() => {
        mockStore.getState.mockReturnValue({
          app: {version: {full: '3.2.0'}},
        })
      })

      it('should return true', async () => {
        const {result} = renderHook(() => useCostMonitoringFeature(), {wrapper})

        expect(result.current).toBe(true)
      })
    })

    describe('when the PC version does not support cost monitoring', () => {
      beforeEach(() => {
        mockStore.getState.mockReturnValue({
          app: {version: {full: '3.1.0'}},
        })
      })

      it('should return false', async () => {
        const {result} = renderHook(() => useCostMonitoringFeature(), {wrapper})

        expect(result.current).toBe(false)
      })
    })
  })

  describe('when neither flag is enabled', () => {
    beforeEach(() => {
      window.sessionStorage.setItem('additionalFeatures', '[]')
      mockStore.getState.mockReturnValue({
        app: {version: {full: '3.1.0'}},
      })
    })

    it('should return false', async () => {
      const {result} = renderHook(() => useCostMonitoringFeature(), {wrapper})

      expect(result.current).toBe(false)
    })
  })
})
