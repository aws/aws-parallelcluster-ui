import {Store} from '@reduxjs/toolkit'
import {render} from '@testing-library/react'
import {mock} from 'jest-mock-extended'
import {I18nextProvider} from 'react-i18next'
import {Provider} from 'react-redux'
import {BrowserRouter} from 'react-router-dom'
import i18n from '../../../i18n'
import {
  ClusterDescription,
  ComputeFleetStatus,
  ClusterStatus,
} from '../../../types/clusters'
import ClusterTabs from '../Details'
import {QueryClient, QueryClientProvider} from 'react-query'

const queryClient = new QueryClient()
const mockStore = mock<Store>()
const MockProviders = (props: any) => (
  <QueryClientProvider client={queryClient}>
    <Provider store={mockStore}>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>{props.children}</BrowserRouter>
      </I18nextProvider>
    </Provider>
  </QueryClientProvider>
)

const baseClusterProps: Partial<ClusterDescription> = {
  creationTime: '2023-03-06T12:15:00.254Z',
  lastUpdatedTime: '2023-03-06T12:15:00.254Z',
  computeFleetStatus: ComputeFleetStatus.Running,
  clusterStatus: ClusterStatus.CreateComplete,
}

describe('Given a cluster and a list of tabs', () => {
  describe("when it's created with a previous PC version", () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        app: {
          clusters: {
            selected: 'foo',
          },
          wizard: {
            version: '3.5.0',
          },
          version: {
            full: ['3.5.0', '3.6.0'],
          },
        },
        clusters: {
          index: {
            foo: {
              ...baseClusterProps,
              version: '3.4.0',
            },
          },
        },
      })
    })
    it("should present an alert saying it can't be edited", () => {
      const {getByText} = render(
        <MockProviders store={mockStore}>
          <ClusterTabs />
        </MockProviders>,
      )

      expect(getByText(/This cluster cannot be edited/i)).toBeDefined()
    })
  })

  describe("when it's created with the same PC version installed", () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        app: {
          clusters: {
            selected: 'foo',
          },
          wizard: {
            version: '3.5.0',
          },
          version: {
            full: ['3.5.0', '3.6.0'],
          },
        },
        clusters: {
          index: {
            foo: {
              ...baseClusterProps,
              version: '3.5.0',
            },
          },
        },
      })
    })
    it('should not present an edit alert', () => {
      const {getByText} = render(
        <MockProviders store={mockStore}>
          <ClusterTabs />
        </MockProviders>,
      )

      expect(() => getByText(/This cluster cannot be edited/i)).toThrowError()
    })
  })
})
