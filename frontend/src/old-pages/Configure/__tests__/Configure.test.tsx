import {Store} from '@reduxjs/toolkit'
import {mock} from 'jest-mock-extended'
import i18n from '../../../i18n'
import {I18nextProvider} from 'react-i18next'
import {QueryClient, QueryClientProvider} from 'react-query'
import {Provider} from 'react-redux'
import {BrowserRouter} from 'react-router-dom'
import {render} from '@testing-library/react'
import Configure from '../Configure'

const queryClient = new QueryClient()
const mockStore = mock<Store>()

const MockProviders = (props: any) => (
  <QueryClientProvider client={queryClient}>
    <I18nextProvider i18n={i18n}>
      <Provider store={mockStore}>
        <BrowserRouter>{props.children}</BrowserRouter>
      </Provider>
    </I18nextProvider>
  </QueryClientProvider>
)

describe('Given a configure component (wizard)', () => {
  describe("when it's being loaded (edit mode or from template)", () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        app: {
          wizard: {
            source: {
              loading: true,
            },
            version: '3.12.0'
          },
        },
      })
    })
    it('should disable the Next button', () => {
      const {getByRole} = render(
        <MockProviders>
          <Configure />
        </MockProviders>,
      )

      expect(
        getByRole('button', {
          name: 'Next',
        }).getAttribute('aria-disabled'),
      ).toBe('true')
    })
  })

  describe("when it's loaded", () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        app: {
          wizard: {
            source: {
              loading: false,
            },
            version: '3.12.0'
          },
        },
      })
    })
    it('should enable the Next button', () => {
      const {getByRole} = render(
        <MockProviders>
          <Configure />
        </MockProviders>,
      )

      expect(
        getByRole('button', {
          name: 'Next',
        }).getAttribute('aria-disabled'),
      ).toBeNull()
    })
  })
})
