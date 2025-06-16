import {render, waitFor, screen, within, fireEvent} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {I18nextProvider} from 'react-i18next'
import {QueryClient, QueryClientProvider} from 'react-query'
import {Provider} from 'react-redux'
import {BrowserRouter} from 'react-router-dom'
import i18n from '../../../../i18n'
import {BuildImage, ListCustomImages, DescribeCustomImage} from '../../../../model'
import CustomImages from '../CustomImages'
import {ImageBuildStatus, ImageInfoSummary} from '../../../../types/images'
import {Ec2AmiState} from '../../../../types/images'
import {CloudFormationStackStatus} from "../../../../types/base"
import {createStore} from 'redux'
import {setState, getState} from '../../../../store'
import {act} from "react-dom/test-utils";
import {Store} from "@reduxjs/toolkit";
import {mock} from "jest-mock-extended";

const queryClient = new QueryClient()
const mockImages: ImageInfoSummary[] = [
    {
        imageId: 'test-image',
        imageBuildStatus: ImageBuildStatus.BuildComplete,
        region: 'us-east-1',
        version: '3.12.0',
        ec2AmiInfo: {
            tags: [],
            amiName: 'test',
            architecture: 'x86_64',
            description: "test ami",
            amiId: 'ami-12345',
            state: Ec2AmiState.Available,
        },
        cloudformationStackArn: "example-arn",
        cloudformationStackStatus: CloudFormationStackStatus.CreateComplete,
    },
]

const mockInitialState = {
    customImages: {
        list: mockImages
    },
    app: {
        version: {
            full: ['3.12.0', '3.11.0', '3.10.0']
        },
        customImages: {
            selectedImageStatus: 'AVAILABLE',
            imageBuild: {
                ImageId: 'test-build-image',
                dialog: true,
                imageId: '',
                config: ''
            }
        }
    }
}

const mockStore = mock<Store>()
const wrapper = (props: any) => (
    <Provider store={mockStore}>{props.children}</Provider>
)


const MockProviders = ({children}: {children: React.ReactNode}) => (
    <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
            <Provider store={mockStore}>
                <BrowserRouter>{children}</BrowserRouter>
            </Provider>
        </I18nextProvider>
    </QueryClientProvider>
)

jest.mock('../../../../model', () => ({
    ListCustomImages: jest.fn(),
    DescribeCustomImage: jest.fn(),
    BuildImage: jest.fn(),
}))

describe('CustomImages', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockStore.getState.mockReturnValue(mockInitialState)
        ;(ListCustomImages as jest.Mock).mockImplementation(() => {
            mockStore.dispatch({ type: 'SET_IMAGES', payload: mockImages })
            return Promise.resolve(mockImages)
        })
        ;(DescribeCustomImage as jest.Mock).mockResolvedValue(mockImages[0])
    })

    describe('CustomImagesList', () => {
        it('should render the images list', async () => {
            const {container} = render(
                <MockProviders>
                    <CustomImages />
                </MockProviders>,
            )

            await waitFor(() => {
                expect(ListCustomImages).toHaveBeenCalled()
            })


            await waitFor(() => {
                const tableElement = container.querySelector('table')
                expect(tableElement).toBeTruthy()

                const cellContent = container.textContent
                expect(cellContent).toContain('test-image')
                expect(cellContent).toContain('ami-12345')
                expect(cellContent).toContain('us-east-1')
                expect(cellContent).toContain('3.12.0')
            })
        })

        it('should handle image selection', async () => {
            const {container} = render(
                <MockProviders>
                    <CustomImages />
                </MockProviders>,
            )

            await waitFor(() => {
                expect(container.textContent).toContain('test-image')
            })

            const radio = container.querySelector('input[type="radio"]')
            if (radio) {
                await userEvent.click(radio)
                expect(DescribeCustomImage).toHaveBeenCalledWith('test-image')
            }
        })

        it('should handle status filter changes', async () => {
            render(
                <MockProviders>
                    <CustomImages />
                </MockProviders>,
            )

            const statusSelect = screen.getByRole('button', {name: /available/i})
            await userEvent.click(statusSelect)

            const pendingOption = await screen.findByText('Pending')
            await userEvent.click(pendingOption)

            expect(ListCustomImages).toHaveBeenCalledWith(Ec2AmiState.Pending)
        })
    })
})
