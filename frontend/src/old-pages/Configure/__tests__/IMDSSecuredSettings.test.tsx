import i18n from 'i18next'
import {I18nextProvider, initReactI18next} from 'react-i18next'
import {mock} from 'jest-mock-extended'
import {Store} from '@reduxjs/toolkit'
import {Provider} from 'react-redux'
import {fireEvent, render, RenderResult} from '@testing-library/react'
import {setState as mockSetState} from '../../../store'
import {IMDSSecuredSettings} from '../HeadNode'

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

describe('given a component to configure IMDS secured setting', () => {
  let screen: RenderResult

  describe('when no value is already present for IMDS secured', () => {
    beforeEach(() => {
      ;(mockSetState as jest.Mock).mockClear()
      screen = render(
        <MockProviders>
          <IMDSSecuredSettings />
        </MockProviders>,
      )
    })

    it('should be set to true', () => {
      expect(mockSetState).toHaveBeenCalledTimes(1)
      expect(mockSetState).toHaveBeenCalledWith(
        ['app', 'wizard', 'config', 'HeadNode', 'Imds', 'Secured'],
        true,
      )
    })
  })

  describe('when the cluster config already had a value of `false` for IMDS secured', () => {
    beforeEach(() => {
      ;(mockSetState as jest.Mock).mockClear()
      mockStore.getState.mockReturnValue({
        app: {
          wizard: {
            config: {
              HeadNode: {Imds: {Secured: false}},
            },
          },
        },
      })

      screen = render(
        <MockProviders>
          <IMDSSecuredSettings />
        </MockProviders>,
      )
    })

    describe('when no action is performed on the checkbox', () => {
      it('should not change the value', () => {
        expect(mockSetState).not.toHaveBeenCalled()
      })
    })

    describe('when the checkbox is clicked once', () => {
      it('should be set to true', () => {
        fireEvent.click(
          screen.getByLabelText('wizard.headNode.imdsSecured.set'),
        )

        expect(mockSetState).toHaveBeenCalledTimes(1)
        expect(mockSetState).toHaveBeenCalledWith(
          ['app', 'wizard', 'config', 'HeadNode', 'Imds', 'Secured'],
          true,
        )
      })
    })
  })

  describe('when editing a cluster', () => {
    beforeEach(() => {
      ;(mockSetState as jest.Mock).mockClear()
      mockStore.getState.mockReturnValue({
        app: {
          wizard: {
            editing: true,
          },
        },
      })

      screen = render(
        <MockProviders>
          <IMDSSecuredSettings />
        </MockProviders>,
      )
    })

    it('should not change the checkbox state', () => {
      expect(mockSetState).not.toHaveBeenCalled()
    })

    it('should be disabled', () => {
      fireEvent.click(screen.getByLabelText('wizard.headNode.imdsSecured.set'))

      expect(mockSetState).not.toHaveBeenCalled()
    })
  })
})
