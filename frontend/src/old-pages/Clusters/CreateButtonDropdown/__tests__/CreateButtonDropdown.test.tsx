import wrapper from '@cloudscape-design/components/test-utils/dom'
import {Store} from '@reduxjs/toolkit'
import {render, RenderResult} from '@testing-library/react'
import i18n from 'i18next'
import {mock} from 'jest-mock-extended'
import {I18nextProvider, initReactI18next} from 'react-i18next'
import {Provider} from 'react-redux'
import {BrowserRouter} from 'react-router-dom'
import {CreateButtonDropdown} from '../CreateButtonDropdown'

i18n.use(initReactI18next).init({
  resources: {},
  lng: 'en',
})

const mockStore = mock<Store>()

const MockProviders = (props: any) => (
  <BrowserRouter>
    <Provider store={mockStore}>
      <I18nextProvider i18n={i18n}>{props.children}</I18nextProvider>
    </Provider>
  </BrowserRouter>
)

describe('given a dropdown button to create a cluster', () => {
  let screen: RenderResult
  let mockOpenWizard: jest.Mock

  beforeEach(() => {
    mockOpenWizard = jest.fn()

    screen = render(
      <MockProviders>
        <CreateButtonDropdown openWizard={mockOpenWizard} />
      </MockProviders>,
    )
  })

  describe('when user selects the option to create a cluster using the wizard', () => {
    beforeEach(() => {
      const buttonDropdown = wrapper(screen.container).findButtonDropdown()!
      buttonDropdown.openDropdown()
      buttonDropdown.findItemById('wizard')?.click()
    })

    it('should open the cluster creation wizard', () => {
      expect(mockOpenWizard).toHaveBeenCalledTimes(1)
    })
  })
})
