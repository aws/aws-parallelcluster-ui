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
import {Store} from '@reduxjs/toolkit'
import {render, RenderResult} from '@testing-library/react'
import i18n from 'i18next'
import {mock} from 'jest-mock-extended'
import {I18nextProvider, initReactI18next} from 'react-i18next'
import {Provider} from 'react-redux'
import {setState as mockSetState, setState} from '../../../../store'
import {ImdsSupportFormField} from '../ImdsSupportFormField'

jest.mock('../../../../store', () => {
  const originalModule = jest.requireActual('../../../../store')

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

describe('given a component to select the IMDS supported version', () => {
  let screen: RenderResult

  beforeEach(() => {
    ;(mockSetState as jest.Mock).mockClear()
  })

  describe('when the version is at least 3.3.0', () => {
    describe('when no value has been selected yet', () => {
      beforeEach(() => {
        mockStore.getState.mockReturnValue({
          app: {
            version: {
              full: '3.3.0',
            },
            wizard: {
              config: {Imds: null},
            },
          },
        })
        screen = render(
          <MockProviders>
            <ImdsSupportFormField />
          </MockProviders>,
        )
      })

      it('should initialize ImdsSupport to v2.0', () => {
        expect(setState).toHaveBeenCalledWith(
          ['app', 'wizard', 'config', 'Imds', 'ImdsSupport'],
          'v2.0',
        )
      })
    })

    describe('when ImdsSupport is already set', () => {
      beforeEach(() => {
        mockStore.getState.mockReturnValue({
          app: {
            version: {
              full: '3.3.0',
            },
            wizard: {
              config: {
                Imds: {ImdsSupport: 'v2.0'},
              },
            },
          },
        })
        screen = render(
          <MockProviders>
            <ImdsSupportFormField />
          </MockProviders>,
        )
      })

      it('should not initialize ImdsSupport', () => {
        expect(setState).not.toHaveBeenCalledWith(
          ['app', 'wizard', 'config', 'Imds', 'ImdsSupport'],
          expect.any(String),
        )
      })

      describe('when user selects an option', () => {
        beforeEach(() => {
          const selectComponent = wrapper(screen.container).findSelect()!
          selectComponent.openDropdown()
          selectComponent.selectOptionByValue('v1.0')
        })

        it('should store the selection in the cluster config', () => {
          expect(mockSetState).toHaveBeenCalledTimes(1)
          expect(mockSetState).toHaveBeenCalledWith(
            ['app', 'wizard', 'config', 'Imds', 'ImdsSupport'],
            'v1.0',
          )
        })
      })
    })

    describe('when user is editing a cluster', () => {
      beforeEach(() => {
        mockStore.getState.mockReturnValue({
          app: {
            version: {
              full: '3.3.0',
            },
            wizard: {
              editing: true,
            },
          },
        })

        screen = render(
          <MockProviders>
            <ImdsSupportFormField />
          </MockProviders>,
        )
      })

      it('should be disabled', () => {
        const selectComponent = wrapper(screen.container).findSelect()!
        expect(selectComponent.isDisabled()).toBe(true)
      })
    })
  })

  describe('when the version is lesser than 3.3.0', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        app: {
          version: {
            full: '3.2.0',
          },
        },
      })

      screen = render(
        <MockProviders>
          <ImdsSupportFormField />
        </MockProviders>,
      )
    })

    it('should not render anything', () => {
      expect(
        screen.queryByLabelText('wizard.cluster.imdsSupport.label'),
      ).toBeNull()
    })

    it('should not initialize ImdsSupport', () => {
      expect(setState).not.toHaveBeenCalledWith(
        ['app', 'wizard', 'config', 'Imds', 'ImdsSupport'],
        expect.any(String),
      )
    })
  })
})
