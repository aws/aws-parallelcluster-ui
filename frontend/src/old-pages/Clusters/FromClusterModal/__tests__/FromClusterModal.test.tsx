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
import React from 'react'
import {fireEvent, render, RenderResult} from '@testing-library/react'
import i18n from 'i18next'
import {I18nextProvider, initReactI18next} from 'react-i18next'
import wrapper from '@cloudscape-design/components/test-utils/dom'
import {FromClusterModal} from '../FromClusterModal'
import {Provider} from 'react-redux'
import {mock} from 'jest-mock-extended'

i18n.use(initReactI18next).init({
  resources: {},
  lng: 'en',
})

const mockStore = mock<Store>()
const MockProviders = (props: any) => (
  <Provider store={mockStore}>
    <I18nextProvider i18n={i18n}>{props.children}</I18nextProvider>
  </Provider>
)

describe('given a modal to select a cluster to copy from', () => {
  let screen: RenderResult
  let mockOnCreate: jest.Mock
  let mockOnDismiss: jest.Mock

  beforeEach(() => {
    mockOnCreate = jest.fn()
    mockOnDismiss = jest.fn()
    mockStore.getState.mockReturnValue({
      clusters: {
        list: [
          {
            clusterName: 'some-name',
            version: '3.5.0',
          },
        ],
      },
      app: {version: {full: ['3.5.0']}},
    })
    screen = render(
      <MockProviders>
        <FromClusterModal
          visible={true}
          onCreate={mockOnCreate}
          onDismiss={mockOnDismiss}
        />
      </MockProviders>,
    )
  })

  describe('when no cluster has been selected yet', () => {
    it('should disable the submit button', () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: 'cluster.fromClusterModal.actions.create',
        }),
      )
      expect(mockOnCreate).toHaveBeenCalledTimes(0)
    })
  })

  describe('when the user selects a cluster and submits', () => {
    beforeEach(() => {
      const select = wrapper(screen.baseElement)
        .findModal()
        ?.findContent()
        .findSelect()!
      select.openDropdown()
      select.selectOptionByValue('some-name')
      fireEvent.click(
        screen.getByRole('button', {
          name: 'cluster.fromClusterModal.actions.create',
        }),
      )
    })

    it('should pass the selected cluster name to the create handler', () => {
      expect(mockOnCreate).toHaveBeenCalledTimes(1)
      expect(mockOnCreate).toHaveBeenCalledWith('some-name')
    })

    it('should dismiss the modal', () => {
      expect(mockOnDismiss).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the user dismisses the modal', () => {
    beforeEach(() => {
      fireEvent.click(
        screen.getByRole('button', {
          name: 'cluster.fromClusterModal.actions.cancel',
        }),
      )
    })

    it('should call the dismiss handler', () => {
      expect(mockOnDismiss).toHaveBeenCalledTimes(1)
    })
  })
})
