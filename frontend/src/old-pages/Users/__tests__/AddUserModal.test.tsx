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
import wrapper from '@cloudscape-design/components/test-utils/dom'
import i18n from 'i18next'
import {mock} from 'jest-mock-extended'
import {I18nextProvider, initReactI18next} from 'react-i18next'
import {Provider} from 'react-redux'
import {setState as mockSetState} from '../../../store'
import {CreateUser as mockCreateUser} from '../../../model'
import AddUserModal from '../AddUserModal'

jest.mock('../../../model', () => {
  const originalModule = jest.requireActual('../../../model')

  return {
    __esModule: true,
    ...originalModule,
    CreateUser: jest.fn(),
  }
})

jest.mock('../../../store', () => {
  const originalModule = jest.requireActual('../../../store')

  return {
    __esModule: true,
    ...originalModule,
    setState: jest.fn(),
  }
})

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
const mockSetVisible = jest.fn()

describe('Given a component to add a new PCUI user', () => {
  let screen: RenderResult

  beforeEach(() => {
    ;(mockSetState as jest.Mock).mockClear()
  })

  describe('when an invalid email is specified, and "Add user" button is pressed', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        app: {
          users: {
            newUser: {
              Username: 'invalid-email',
            },
          },
        },
      })

      screen = render(
        <MockProviders>
          <AddUserModal visible={true} setVisible={mockSetVisible} />
        </MockProviders>,
      )

      fireEvent.click(
        screen.getByRole('button', {
          name: 'users.actions.add',
        }),
      )
    })

    it('should set the correspondent error message and keep the modal visible', () => {
      expect(mockSetState).toHaveBeenCalledTimes(1)
      expect(mockSetState).toHaveBeenCalledWith(
        ['app', 'users', 'errors', 'newUser'],
        'users.errors.invalidEmail',
      )
      expect(mockSetVisible).toHaveBeenCalledTimes(0)
    })
  })

  describe('when create button has been pressed with an invalid email', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        app: {
          users: {
            errors: {
              newUser: 'invalidEmail',
            },
          },
        },
      })

      screen = render(
        <MockProviders>
          <AddUserModal visible={true} setVisible={mockSetVisible} />
        </MockProviders>,
      )
    })

    it('the form field should display the correspondent error message', () => {
      expect(
        wrapper(screen.baseElement).findFormField()?.findError()?.getElement()
          .textContent,
      ).toBe('invalidEmail')
    })
  })

  describe('when a valid email is specified, and "Add user" button is pressed', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        app: {
          users: {
            newUser: {
              Username: 'valid-email@domain.com',
            },
          },
        },
      })

      screen = render(
        <MockProviders>
          <AddUserModal visible={true} setVisible={mockSetVisible} />
        </MockProviders>,
      )

      fireEvent.click(
        screen.getByRole('button', {
          name: 'users.actions.add',
        }),
      )
    })

    it('should call "CreateUser" function and close the modal', () => {
      expect(mockCreateUser).toHaveBeenCalledTimes(1)
      expect(mockSetVisible).toHaveBeenCalledWith(false)
    })
  })
})
