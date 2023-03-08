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
import userEvent from '@testing-library/user-event'
import i18n from 'i18next'
import {mock} from 'jest-mock-extended'
import {I18nextProvider, initReactI18next} from 'react-i18next'
import {Provider} from 'react-redux'
import {setState as mockSetState} from '../../../../store'
import {ClusterNameField} from '../ClusterNameField'

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

describe('given a component to set the ClusterName', () => {
  let screen: RenderResult

  beforeEach(() => {
    ;(mockSetState as jest.Mock).mockClear()
  })

  describe('when user fills in the cluster name', () => {
    beforeEach(() => {
      screen = render(
        <MockProviders>
          <ClusterNameField />
        </MockProviders>,
      )

      fireEvent.change(
        screen.getByPlaceholderText('wizard.cluster.clusterName.placeholder'),
        {target: {value: 'some-name'}},
      )
    })

    it('should store the ClusterName in the cluster config', () => {
      expect(mockSetState).toHaveBeenCalledTimes(1)
      expect(mockSetState).toHaveBeenCalledWith(
        ['app', 'wizard', 'clusterName'],
        'some-name',
      )
    })
  })

  describe('when user is editing a cluster', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        app: {wizard: {editing: true}},
      })
    })

    describe('when user tries to fill in the cluster name', () => {
      beforeEach(() => {
        screen = render(
          <MockProviders>
            <ClusterNameField />
          </MockProviders>,
        )

        userEvent.type(
          screen.getByPlaceholderText('wizard.cluster.clusterName.placeholder'),
          'some-name',
        )
      })

      it('should be disabled', () => {
        expect(mockSetState).toHaveBeenCalledTimes(0)
      })
    })
  })
})
