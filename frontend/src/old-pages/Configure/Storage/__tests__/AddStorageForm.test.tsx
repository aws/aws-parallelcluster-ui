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
import {StorageTypeOption} from '../../Storage'
import {AddStorageForm} from '../AddStorageForm'

i18n.use(initReactI18next).init({
  resources: {},
  lng: 'en',
})

const MockProviders = (props: any) => (
  <I18nextProvider i18n={i18n}>{props.children}</I18nextProvider>
)

describe('given a component to select from a range of storage type options', () => {
  let screen: RenderResult
  let mockStorageTypes: StorageTypeOption[]
  let mockOnSubmit: jest.Mock

  beforeEach(() => {
    mockStorageTypes = [
      ['Efs', 'Efs'],
      ['Ebs', 'Ebs'],
    ]
    mockOnSubmit = jest.fn()
    screen = render(
      <MockProviders>
        <AddStorageForm
          storageTypes={mockStorageTypes}
          onSubmit={mockOnSubmit}
        />
      </MockProviders>,
    )
  })

  describe('when no storage type has been selected yet', () => {
    it('should disable the submit button', () => {
      screen
        .getByRole('button', {name: 'wizard.storage.container.addStorage'})
        .click()
      expect(mockOnSubmit).toHaveBeenCalledTimes(0)
    })
  })

  describe('when user submits a storage type', () => {
    beforeEach(() => {
      const multiSelectComponent = wrapper(screen.container).findMultiselect()!
      multiSelectComponent.openDropdown()
      multiSelectComponent.selectOptionByValue('Efs')
    })

    it('should pass the selected storage to the submission handler', () => {
      screen
        .getByRole('button', {name: 'wizard.storage.container.addStorage'})
        .click()
      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      expect(mockOnSubmit).toHaveBeenCalledWith(['Efs'])
    })
  })

  describe('when user submits more than one storage type', () => {
    beforeEach(() => {
      const multiSelectComponent = wrapper(screen.container).findMultiselect()!
      multiSelectComponent.openDropdown()
      multiSelectComponent.selectOptionByValue('Efs')
      multiSelectComponent.selectOptionByValue('Ebs')
    })
    it('should pass all the selected storages to the submission handler', () => {
      screen
        .getByRole('button', {name: 'wizard.storage.container.addStorage'})
        .click()
      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      expect(mockOnSubmit).toHaveBeenCalledWith(['Efs', 'Ebs'])
    })
  })
})
