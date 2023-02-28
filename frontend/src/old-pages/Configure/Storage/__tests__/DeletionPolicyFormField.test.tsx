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

import wrapper from '@cloudscape-design/components/test-utils/dom'
import {render, RenderResult} from '@testing-library/react'
import i18n from 'i18next'
import {I18nextProvider, initReactI18next} from 'react-i18next'
import {DeletionPolicy} from '../../Storage.types'
import {DeletionPolicyFormField} from '../DeletionPolicyFormField'

i18n.use(initReactI18next).init({
  resources: {},
  lng: 'en',
})

const MockProviders = (props: any) => (
  <I18nextProvider i18n={i18n}>{props.children}</I18nextProvider>
)

describe('given a component to select from a range of deletion policy options', () => {
  let screen: RenderResult
  let mockDeletionPolicyOptions: DeletionPolicy[]
  let mockOnChange: jest.Mock

  beforeEach(() => {
    mockDeletionPolicyOptions = ['Delete', 'Retain']
    mockOnChange = jest.fn()
    screen = render(
      <MockProviders>
        <DeletionPolicyFormField
          options={mockDeletionPolicyOptions}
          value={'Delete'}
          onDeletionPolicyChange={mockOnChange}
        />
      </MockProviders>,
    )
  })

  describe('when user selects an option', () => {
    let selectedOption: DeletionPolicy = 'Retain'

    beforeEach(() => {
      const selectComponent = wrapper(screen.container).findSelect()!
      selectComponent.openDropdown()
      selectComponent.selectOptionByValue(selectedOption)
    })

    it('should pass the selected policy to the selection handler', () => {
      expect(mockOnChange).toHaveBeenCalledTimes(1)
      expect(mockOnChange).toHaveBeenCalledWith(selectedOption)
    })
  })
})
