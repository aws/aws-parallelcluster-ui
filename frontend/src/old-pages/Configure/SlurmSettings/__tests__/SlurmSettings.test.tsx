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
import {I18nextProvider} from 'react-i18next'
import i18n from 'i18next'
import {initReactI18next} from 'react-i18next'
import mock from 'jest-mock-extended/lib/Mock'
import {Store} from '@reduxjs/toolkit'
import {Provider} from 'react-redux'
import {SlurmSettings} from '../SlurmSettings'

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

describe('given a component to configure the SlurmSettings', () => {
  describe('when the version is at least 3.3.0', () => {
    let screen: RenderResult

    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        app: {
          version: {
            full: '3.3.0',
          },
        },
      })
      screen = render(
        <MockProviders>
          <SlurmSettings />
        </MockProviders>,
      )
    })

    it('should render the form', () => {
      expect(
        screen.queryByText('wizard.headNode.slurmSettings.container.title'),
      ).toBeTruthy()
    })
  })

  describe('when the version is lesser than 3.3.0', () => {
    let screen: RenderResult

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
          <SlurmSettings />
        </MockProviders>,
      )
    })

    it('should hide the form', () => {
      expect(
        screen.queryByText('wizard.headNode.slurmSettings.container.title'),
      ).toBeNull()
    })
  })
})
