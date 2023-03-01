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
import {setState as mockSetState} from '../../../store'
import {MultiUser} from '../MultiUser'

jest.mock('../../../store', () => {
  const originalModule = jest.requireActual('../../../store')

  return {
    __esModule: true, // Use it when dealing with esModules
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

describe('given a component to configure multiple user management', () => {
  let screen: RenderResult

  beforeEach(() => {
    ;(mockSetState as jest.Mock).mockClear()
  })

  describe('when GenerateSshKeysForUsers is not set', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        app: {
          wizard: {
            config: {
              DirectoryService: {GenerateSshKeysForUsers: null},
            },
          },
        },
      })

      screen = render(
        <MockProviders>
          <MultiUser />
        </MockProviders>,
      )
    })

    it('should initialize GenerateSshKeysForUsers to true', () => {
      expect(mockSetState).toHaveBeenCalledTimes(1)
      expect(mockSetState).toHaveBeenCalledWith(
        [
          'app',
          'wizard',
          'config',
          'DirectoryService',
          'GenerateSshKeysForUsers',
        ],
        true,
      )
    })
  })

  describe('when GenerateSshKeysForUsers is already set', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        app: {
          wizard: {
            config: {
              DirectoryService: {GenerateSshKeysForUsers: false},
            },
          },
        },
      })

      screen = render(
        <MockProviders>
          <MultiUser />
        </MockProviders>,
      )
    })

    it('should not change the value of GenerateSshKeysForUsers', () => {
      expect(mockSetState).toHaveBeenCalledTimes(0)
    })
  })

  describe('when user intreacts with the GenerateSshKeysForUsers checkbox', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        app: {
          wizard: {
            config: {
              DirectoryService: {GenerateSshKeysForUsers: true},
            },
          },
        },
      })

      screen = render(
        <MockProviders>
          <MultiUser />
        </MockProviders>,
      )

      fireEvent.click(
        screen.getByLabelText('wizard.cluster.multiUser.generateSSHKeys.name'),
      )
    })

    it('should updated the value of GenerateSshKeysForUsers', () => {
      expect(mockSetState).toHaveBeenCalledTimes(1)
      expect(mockSetState).toHaveBeenCalledWith(
        [
          'app',
          'wizard',
          'config',
          'DirectoryService',
          'GenerateSshKeysForUsers',
        ],
        false,
      )
    })
  })
})
