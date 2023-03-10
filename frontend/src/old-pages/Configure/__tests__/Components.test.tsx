import {Store} from '@reduxjs/toolkit'
import {fireEvent, render} from '@testing-library/react'
import {mock} from 'jest-mock-extended'
import {I18nextProvider} from 'react-i18next'
import {Provider} from 'react-redux'
import i18n from '../../../i18n'
import {ActionEditor} from '../Components'

jest.mock('../../../store', () => {
  const originalModule = jest.requireActual('../../../store')

  return {
    __esModule: true, // Use it when dealing with esModules
    ...originalModule,
    clearState: jest.fn(),
  }
})
import {clearState} from '../../../store'

const mockStore = mock<Store>()
const MockProviders = (props: any) => (
  <Provider store={mockStore}>
    <I18nextProvider i18n={i18n}>{props.children}</I18nextProvider>
  </Provider>
)

describe('Given an action editor', () => {
  describe('when a script has already been given', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        actions: {
          Args: ['--test'],
          Script: '/home.sh',
        },
      })
    })

    it('should show the script field and parameters', () => {
      const {getByDisplayValue} = render(
        <MockProviders store={mockStore}>
          <ActionEditor
            error=""
            label="Run script on node start"
            path={['actions']}
          />
        </MockProviders>,
      )

      expect(getByDisplayValue('/home.sh')).toBeDefined()
      expect(getByDisplayValue('--test')).toBeDefined()
    })

    describe('when deselecting the script', () => {
      it('should remove it from the cluster config', () => {
        const {getByText} = render(
          <MockProviders store={mockStore}>
            <ActionEditor
              error=""
              label="Run script on node start"
              path={['actions']}
            />
          </MockProviders>,
        )

        fireEvent.click(getByText('Run script on node start'))
        expect(clearState).toHaveBeenCalledWith(['actions'])
      })
    })
  })

  describe('when a script has not already been given', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        actions: {
          Args: ['--test'],
        },
      })
    })

    it('should not show any fields or parameters', () => {
      const {getByDisplayValue} = render(
        <MockProviders store={mockStore}>
          <ActionEditor
            error=""
            label="Run script on node start"
            path={['actions']}
          />
        </MockProviders>,
      )

      expect(() => getByDisplayValue('--test')).toThrowError()
    })
  })
})
