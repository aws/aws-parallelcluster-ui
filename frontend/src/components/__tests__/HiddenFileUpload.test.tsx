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

import {render, RenderResult} from '@testing-library/react'
import {HiddenFileUpload} from '../HiddenFileUpload'

/**
 * This test is here to make sure that
 * users of the component can reset the `open` prop
 * after the file selector dialog has been opened.
 *
 * This is needed as there is no way to intercept
 * actual cancel event on the brower's file picker
 *
 * The test can be removed when this quirk has been resolved.
 */

describe('given a hidden file input field', () => {
  let screen: RenderResult
  let mockOnDismiss: jest.Mock
  let mockOnChange: jest.Mock

  describe('when open is set to true', () => {
    beforeEach(() => {
      mockOnDismiss = jest.fn()
      mockOnChange = jest.fn()

      screen = render(
        <HiddenFileUpload
          open={true}
          onDismiss={mockOnDismiss}
          onChange={mockOnChange}
        />,
      )
    })
    it('should call the onDismiss handler', () => {
      expect(mockOnDismiss).toHaveBeenCalledTimes(1)
    })
  })
  describe('when open is set to false', () => {
    beforeEach(() => {
      mockOnDismiss = jest.fn()
      mockOnChange = jest.fn()

      screen = render(
        <HiddenFileUpload
          open={false}
          onDismiss={mockOnDismiss}
          onChange={mockOnChange}
        />,
      )
    })

    it('should not call any handler', () => {
      expect(mockOnDismiss).toHaveBeenCalledTimes(0)
    })
  })
})
