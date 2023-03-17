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

import {mock, MockProxy} from 'jest-mock-extended'
import {Instance, NodeType} from '../../../types/instances'
import {LogStreamView} from '../../../types/logs'
import {withNodeType} from '../withNodeType'

describe('given a logstream and the headnode instance', () => {
  let mockHeadNode: MockProxy<Instance | null>
  let mockLogStream: LogStreamView

  beforeEach(() => {
    mockLogStream = {
      instanceId: 'some-instance-id',
      logStreamName: 'hostname.instanceId.logIdentifier',
      hostname: 'hostname',
      logIdentifier: 'logIdentifier',
      lastEventTimestamp: '2023-03-10T08:45:17.133Z',
      nodeType: null,
    }
  })

  describe('when the headnode instance is not available', () => {
    beforeEach(() => {
      mockHeadNode = null
    })

    it('should return null as node type', () => {
      expect(withNodeType(mockHeadNode, mockLogStream)).toEqual({
        ...mockLogStream,
        nodeType: null,
      })
    })
  })
  describe('when the headnode instance is available', () => {
    describe('when the logstream belongs to the headnode', () => {
      beforeEach(() => {
        mockHeadNode = mock<Instance>({
          instanceId: 'some-instance-id',
        })
      })
      it('should set headnode as node type', () => {
        expect(withNodeType(mockHeadNode, mockLogStream)).toEqual({
          ...mockLogStream,
          nodeType: NodeType.HeadNode,
        })
      })
    })
    describe('when the logstream does not belong to the headnode', () => {
      beforeEach(() => {
        mockHeadNode = mock<Instance>({
          instanceId: 'some-other-instance-id',
        })
      })
      it('should set compute node as node type', () => {
        expect(withNodeType(mockHeadNode, mockLogStream)).toEqual({
          ...mockLogStream,
          nodeType: NodeType.ComputeNode,
        })
      })
    })
  })
})
