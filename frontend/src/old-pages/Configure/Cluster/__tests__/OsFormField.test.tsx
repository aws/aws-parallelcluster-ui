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


const mockSetState = jest.fn()

let mockStateValues: Record<string, any> = {}
function mockUseState(path: string[]) {
  const key = path.join('.')
  return mockStateValues[key]
}

jest.mock('../../../../store', () => ({
  ...(jest.requireActual('../../../../store') as any),
  setState: (...args: unknown[]) => mockSetState(...args),
  useState: (path: string[]) => mockUseState(path),
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
    mockStateValues = {}
  })

  describe('when user selects an option', () => {
    beforeEach(() => {
      mockStateValues['app.wizard.version'] = '3.7.0'
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
      mockStateValues['app.wizard.version'] = '3.6.0'
      mockStateValues['app.wizard.editing'] = true
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
      mockStateValues['app.wizard.version'] = '3.6.0'
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
      mockStateValues['app.wizard.version'] = '3.3.0'
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

  describe('when the version is >= 3.9.0', () => {
    beforeEach(() => {
      mockStateValues['app.wizard.version'] = '3.9.0'
    })

    describe('when the user choose between supported oses', () => {
      beforeEach(() => {
        screen = render(
          <MockProviders>
            <OsFormField />
          </MockProviders>,
        )
      })

      it('should have Rocky Linux 9 as an available option', () => {
        expect(screen.getByLabelText('Rocky Linux 9')).toBeTruthy()
      })

      it('should have Red Hat Enterprise Linux 9 as an available option', () => {
        expect(screen.getByLabelText('Red Hat Enterprise Linux 9')).toBeTruthy()
      })

      it('should still have CentOS 7 (not yet deprecated in 3.9.0)', () => {
        expect(screen.getByLabelText('CentOS 7')).toBeTruthy()
      })

      it('should not yet have Amazon Linux 2023 (introduced in 3.10.0)', () => {
        expect(screen.queryByText('Amazon Linux 2023')).toBeNull()
      })
    })
  })

  describe('when the version is >= 3.10.0', () => {
    beforeEach(() => {
      mockStateValues['app.wizard.version'] = '3.10.0'
    })

    describe('when the user choose between supported oses', () => {
      beforeEach(() => {
        screen = render(
          <MockProviders>
            <OsFormField />
          </MockProviders>,
        )
      })

      it('should have Amazon Linux 2023 as an available option', () => {
        expect(screen.getByLabelText('Amazon Linux 2023')).toBeTruthy()
      })

      it('should not have CentOS 7 (deprecated in 3.10.0)', () => {
        expect(screen.queryByText('CentOS 7')).toBeNull()
      })
    })
  })

  describe('when the version is >= 3.13.0', () => {
    beforeEach(() => {
      mockStateValues['app.wizard.version'] = '3.13.0'
    })

    describe('when the user choose between supported oses', () => {
      beforeEach(() => {
        screen = render(
          <MockProviders>
            <OsFormField />
          </MockProviders>,
        )
      })

      it('should have Ubuntu 24.04 as an available option', () => {
        expect(screen.getByLabelText('Ubuntu 24.04')).toBeTruthy()
      })
    })
  })

  describe('when the version is >= 3.14.0', () => {
    beforeEach(() => {
      mockStateValues['app.wizard.version'] = '3.14.0'
    })

    describe('when the user choose between supported oses', () => {
      beforeEach(() => {
        screen = render(
          <MockProviders>
            <OsFormField />
          </MockProviders>,
        )
      })

      it('should not have Ubuntu 20.04 (deprecated in 3.14.0)', () => {
        expect(screen.queryByText('Ubuntu 20.04')).toBeNull()
      })

      it('should have Ubuntu 24.04 as an available option', () => {
        expect(screen.getByLabelText('Ubuntu 24.04')).toBeTruthy()
      })
    })
  })
})
