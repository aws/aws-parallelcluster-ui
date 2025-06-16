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
import {fireEvent, render, RenderResult} from '@testing-library/react'
import i18n from 'i18next'
import {mock} from 'jest-mock-extended'
import {I18nextProvider, initReactI18next} from 'react-i18next'
import {Provider} from 'react-redux'
import {OsFormField} from '../OsFormField'


const mockUseState = jest.fn()
const mockSetState = jest.fn()

jest.mock('../../../../store', () => ({
  ...(jest.requireActual('../../../../store') as any),
  setState: (...args: unknown[]) => mockSetState(...args),
  useState: (...args: unknown[]) => mockUseState(...args),
}))

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

describe('given a component to select an Operating System', () => {
  let screen: RenderResult

  beforeEach(() => {
    ;(mockSetState as jest.Mock).mockClear()
  })

  describe('when user selects an option', () => {
    beforeEach(() => {
      screen = render(
        <MockProviders>
          <OsFormField />
        </MockProviders>,
      )

      fireEvent.click(screen.getByLabelText('CentOS 7'))
    })

    it('should store the OS in the cluster config', () => {
      expect(mockSetState).toHaveBeenCalledTimes(1)
      expect(mockSetState).toHaveBeenCalledWith(
        ['app', 'wizard', 'config', 'Image', 'Os'],
        'centos7',
      )
    })
  })

  describe('when user is editing a cluster', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        app: {wizard: {editing: true}},
      })
      mockUseState.mockReturnValue('3.6.0')
    })

    describe('when user selects an option', () => {
      beforeEach(() => {
        screen = render(
          <MockProviders>
            <OsFormField />
          </MockProviders>,
        )

        fireEvent.click(screen.getByLabelText('CentOS 7'))
      })

      it('should be disabled', () => {
        expect(mockSetState).toHaveBeenCalledTimes(0)
      })
    })
  })

  describe('when the version is >= 3.6.0', () => {
    beforeEach(() => {
      mockUseState.mockReturnValue('3.6.0')
    })

    describe('when the user choose between supported oses', () => {
      beforeEach(() => {
        screen = render(
          <MockProviders>
            <OsFormField />
          </MockProviders>,
        )
      })

      it('should have RHEL 8 as an available option', () => {
        expect(screen.getByLabelText('Red Hat Enterprise Linux 8')).toBeTruthy()
      })
    })
  })

  describe('when the version is < 3.6.0', () => {
    beforeEach(() => {
      mockUseState.mockReturnValue('3.3.0')
    })

    describe('when the user choose between supported oses', () => {
      beforeEach(() => {
        screen = render(
          <MockProviders>
            <OsFormField />
          </MockProviders>,
        )
      })

      it('should not have RHEL 8 as an available option', () => {
        expect(screen.queryByText('Red Hat Enterprise Linux 8')).toBeNull()
      })
    })
  })
})
