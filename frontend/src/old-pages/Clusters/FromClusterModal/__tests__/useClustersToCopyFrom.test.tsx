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
import {ClusterInfoSummary, ClusterStatus} from '../../../../types/clusters'
import {useClustersToCopyFrom} from '../useClustersToCopyFrom'

const mockStore = mock<Store>()

const wrapper: React.FC<PropsWithChildren<any>> = ({children}) => (
  <Provider store={mockStore}>{children}</Provider>
)

describe('given a hook to list the clusters that can be copied from', () => {
  describe("when no cluster is available in the user's account", () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        clusters: {
          list: null,
        },
      })
    })
    it('should return an empty list', () => {
      const {result} = renderHook(() => useClustersToCopyFrom(), {wrapper})

      expect(result.current).toEqual([])
    })
  })

  describe('when the list of clusters is available', () => {
    describe('when one of the clusters is in DeleteInProgress', () => {
      beforeEach(() => {
        mockStore.getState.mockReturnValue({
          app: {
            version: {
              full: ['3.5.0'],
            },
          },
          clusters: {
            list: [
              {
                version: '3.5.0',
                clusterName: 'some-name-delete-in-progress',
                clusterStatus: ClusterStatus.DeleteInProgress,
              },
              {
                version: '3.5.0',
                clusterName: 'some-name',
                clusterStatus: ClusterStatus.CreateComplete,
              },
            ] as Partial<ClusterInfoSummary>[],
          },
        })
      })
      it('should filter out that cluster', () => {
        const {result} = renderHook(() => useClustersToCopyFrom(), {wrapper})

        expect(result.current).toEqual([
          {
            label: 'some-name',
            value: 'some-name',
          },
        ])
      })
    })

    describe('when one of the clusters was created with a different PC version', () => {
      describe('when major and minor are the same', () => {
        beforeEach(() => {
          mockStore.getState.mockReturnValue({
            app: {
              version: {
                full: ['3.5.0', '3.6.0'],
              },
            },
            clusters: {
              list: [
                {
                  clusterName: 'some-name',
                  version: '3.5.1',
                },
              ] as Partial<ClusterInfoSummary>[],
            },
          })
        })
        it('should keep that cluster', () => {
          const {result} = renderHook(() => useClustersToCopyFrom(), {wrapper})

          expect(result.current).toEqual([
            {
              label: 'some-name',
              value: 'some-name',
            },
          ])
        })
      })
      describe('when the major is different', () => {
        beforeEach(() => {
          mockStore.getState.mockReturnValue({
            app: {
              version: {
                full: ['3.5.0'],
              },
            },
            clusters: {
              list: [
                {
                  clusterName: 'some-name',
                  version: '3.5.0',
                },
                {
                  clusterName: 'some-name-different-major',
                  version: '2.5.0',
                },
              ] as Partial<ClusterInfoSummary>[],
            },
          })
        })
        it('should filter out that cluster', () => {
          const {result} = renderHook(() => useClustersToCopyFrom(), {wrapper})

          expect(result.current).toEqual([
            {
              label: 'some-name',
              value: 'some-name',
            },
          ])
        })
      })
      describe('when the minor is different', () => {
        beforeEach(() => {
          mockStore.getState.mockReturnValue({
            app: {
              version: {
                full: ['3.5.0'],
              },
            },
            clusters: {
              list: [
                {
                  clusterName: 'some-name',
                  version: '3.5.0',
                },
                {
                  clusterName: 'some-name-different-minor',
                  version: '3.6.0',
                },
              ] as Partial<ClusterInfoSummary>[],
            },
          })
        })
        it('should filter out that cluster', () => {
          const {result} = renderHook(() => useClustersToCopyFrom(), {wrapper})

          expect(result.current).toEqual([
            {
              label: 'some-name',
              value: 'some-name',
            },
          ])
        })
      })
    })
  })
})
