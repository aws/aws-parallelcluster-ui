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
import {setState} from '../../../store'
import {EbsSettings, EfsSettings, FsxLustreSettings} from '../Storage'

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

describe('Given a Lustre storage component', () => {
  beforeEach(() => {
    ;(setState as jest.Mock).mockClear()
  })
  describe("when it's initialized", () => {
    describe('with a Persistent_1 type', () => {
      beforeEach(() => {
        mockStore.getState.mockReturnValue({
          app: {
            wizard: {
              config: {
                SharedStorage: [
                  {
                    FsxLustreSettings: {
                      DeploymentType: 'PERSISTENT_1',
                    },
                  },
                ],
              },
            },
          },
        })
      })
      it('should set the correct PerUnitStorageThroughPut value in the config', () => {
        render(
          <MockProviders>
            <FsxLustreSettings index={0} />
          </MockProviders>,
        )
        expect(setState).toHaveBeenCalledWith(
          [
            'app',
            'wizard',
            'config',
            'SharedStorage',
            0,
            'FsxLustreSettings',
            'PerUnitStorageThroughput',
          ],
          200,
        )
      })
    })
    describe('with a Persistent_2 type', () => {
      beforeEach(() => {
        mockStore.getState.mockReturnValue({
          app: {
            wizard: {
              config: {
                SharedStorage: [
                  {
                    FsxLustreSettings: {
                      DeploymentType: 'PERSISTENT_2',
                    },
                  },
                ],
              },
            },
          },
        })
      })
      it('should set the correct PerUnitStorageThroughPut value in the config', () => {
        render(
          <MockProviders>
            <FsxLustreSettings index={0} />
          </MockProviders>,
        )
        expect(setState).toHaveBeenCalledWith(
          [
            'app',
            'wizard',
            'config',
            'SharedStorage',
            0,
            'FsxLustreSettings',
            'PerUnitStorageThroughput',
          ],
          125,
        )
      })
    })

    describe('when the user wants to link an already created Lustre', () => {
      beforeEach(() => {
        mockStore.getState.mockReturnValue({
          app: {
            wizard: {
              storage: {
                ui: [
                  {
                    useExisting: true,
                  },
                ],
              },
              config: {
                SharedStorage: [
                  {
                    FsxLustreSettings: {
                      DeploymentType: 'PERSISTENT_2',
                    },
                  },
                ],
              },
            },
          },
        })
      })

      it('should not set the PerUnitStorageThroughPut in the config', () => {
        render(
          <MockProviders>
            <FsxLustreSettings index={0} />
          </MockProviders>,
        )
        expect(setState).not.toHaveBeenCalledWith(
          [
            'app',
            'wizard',
            'config',
            'SharedStorage',
            0,
            'FsxLustreSettings',
            'PerUnitStorageThroughput',
          ],
          expect.any(Number),
        )
      })
    })
  })

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
          <FsxLustreSettings index={0} />
        </MockProviders>,
      )
    })

    it('should initialize the DeletionPolicy to Retain', () => {
      expect(setState).toHaveBeenCalledWith(
        [
          'app',
          'wizard',
          'config',
          'SharedStorage',
          0,
          'FsxLustreSettings',
          'DeletionPolicy',
        ],
        'Retain',
      )
    })

    it('should allow users to change the DeletionPolicy', () => {
      expect(
        screen.queryByLabelText('wizard.storage.instance.deletionPolicy.label'),
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
          <FsxLustreSettings index={0} />
        </MockProviders>,
      )
    })

    it('should not initialize the DeletionPolicy', () => {
      expect(setState).not.toHaveBeenCalledWith(
        [
          'app',
          'wizard',
          'config',
          'SharedStorage',
          0,
          'FsxLustreSettings',
          'DeletionPolicy',
        ],
        expect.any(String),
      )
    })

    it('should not allow users to change the DeletionPolicy', () => {
      expect(
        screen.queryByLabelText('wizard.storage.instance.deletionPolicy.label'),
      ).toBeNull()
    })
  })
})

describe('given a component to display an Efs storage instance', () => {
  beforeEach(() => {
    ;(setState as jest.Mock).mockClear()
  })

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
          <EfsSettings index={0} />
        </MockProviders>,
      )
    })

    it('should initialize the DeletionPolicy to Retain', () => {
      expect(setState).toHaveBeenCalledWith(
        [
          'app',
          'wizard',
          'config',
          'SharedStorage',
          0,
          'EfsSettings',
          'DeletionPolicy',
        ],
        'Retain',
      )
    })

    it('should allow users to change the DeletionPolicy', () => {
      expect(
        screen.queryByLabelText('wizard.storage.instance.deletionPolicy.label'),
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
          <EfsSettings index={0} />
        </MockProviders>,
      )
    })

    it('should not initialize the DeletionPolicy', () => {
      expect(setState).not.toHaveBeenCalledWith(
        [
          'app',
          'wizard',
          'config',
          'SharedStorage',
          0,
          'EfsSettings',
          'DeletionPolicy',
        ],
        expect.any(String),
      )
    })

    it('should not allow users to change the DeletionPolicy', () => {
      expect(
        screen.queryByLabelText('wizard.storage.instance.deletionPolicy.label'),
      ).toBeNull()
    })
  })
})

describe('given a component to display an Ebs storage instance', () => {
  beforeEach(() => {
    ;(setState as jest.Mock).mockClear()
  })

  describe('when the version is at least 3.2.0', () => {
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
          <EbsSettings index={0} />
        </MockProviders>,
      )
    })

    it('should initialize the DeletionPolicy to Retain', () => {
      expect(setState).toHaveBeenCalledWith(
        [
          'app',
          'wizard',
          'config',
          'SharedStorage',
          0,
          'EbsSettings',
          'DeletionPolicy',
        ],
        'Retain',
      )
    })

    it('should allow users to change the DeletionPolicy', () => {
      expect(
        screen.queryByLabelText('wizard.storage.instance.deletionPolicy.label'),
      ).toBeTruthy()
    })
  })

  describe('when the version is lesser than 3.2.0', () => {
    let screen: RenderResult

    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        app: {
          version: {
            full: '3.1.0',
          },
        },
      })
      screen = render(
        <MockProviders>
          <EbsSettings index={0} />
        </MockProviders>,
      )
    })

    it('should not initialize the DeletionPolicy', () => {
      expect(setState).not.toHaveBeenCalledWith(
        [
          'app',
          'wizard',
          'config',
          'SharedStorage',
          0,
          'EbsSettings',
          'DeletionPolicy',
        ],
        expect.any(String),
      )
    })

    it('should not allow users to change the DeletionPolicy', () => {
      expect(
        screen.queryByLabelText('wizard.storage.instance.deletionPolicy.label'),
      ).toBeNull()
    })
  })
})
