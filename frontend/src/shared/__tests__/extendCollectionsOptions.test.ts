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

import {extendCollectionsOptions} from '../extendCollectionsOptions'

describe('given a mixin to extend a CollectionOptions object', () => {
  describe('when no options are provided', () => {
    it('should return the default options', () => {
      expect(extendCollectionsOptions()).toEqual({pagination: {pageSize: 20}})
    })
  })

  describe('when options are provided', () => {
    describe('when the given options override the defaults', () => {
      it('should override the default options', () => {
        const options = {pagination: {pageSize: 15}}
        expect(extendCollectionsOptions(options)).toEqual({
          pagination: {pageSize: 15},
        })
      })
    })

    describe('when the given options do not overlap with the defaults', () => {
      it('should add the defaults to the given options', () => {
        const options = {
          filtering: {defaultFilteringText: 'some-text'},
          pagination: {defaultPage: 2},
        }
        expect(extendCollectionsOptions(options)).toEqual({
          filtering: {defaultFilteringText: 'some-text'},
          pagination: {pageSize: 20, defaultPage: 2},
        })
      })
    })
  })
})
