import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../../i18n';
import OfficialImages from '../OfficialImages';
import { ListOfficialImages } from '../../../../model';
import { mock } from "jest-mock-extended";
import { Store } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from 'react-query';

jest.mock('../../../../model', () => ({
    ListOfficialImages: jest.fn(),
}));

const mockImages = [
    {
        amiId: 'ami-123',
        os: 'alinux2',
        architecture: 'x86_64',
        version: '3.12.0'
    },
    {
        amiId: 'ami-456',
        os: 'ubuntu2004',
        architecture: 'arm64',
        version: '3.9.0'
    }
];

const queryClient = new QueryClient();
const mockStore = mock<Store>();
const mockUseState = jest.fn();
const mockSetState = jest.fn();

jest.mock('../../../../store', () => ({
    setState: (...args: unknown[]) => mockSetState(...args),
    useState: (...args: unknown[]) => mockUseState(...args),
}));

jest.mock('react-i18next', () => ({
    ...jest.requireActual('react-i18next'),
    useTranslation: () => ({
        t: (key: string) => {
            const translations: { [key: string]: string } = {
                'officialImages.header.title': 'Official Images',
                'officialImages.header.description': 'List of available ParallelCluster official AMIs',
                'officialImages.list.columns.id': 'AMI ID',
                'officialImages.list.columns.os': 'OS',
                'officialImages.list.columns.architecture': 'Architecture',
                'officialImages.list.columns.version': 'Version'
            };
            return translations[key] || key;
        }
    }),
    Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

const MockProviders = ({children}: {children: React.ReactNode}) => (
    <QueryClientProvider client={queryClient}>
        <Provider store={mockStore}>
            <I18nextProvider i18n={i18n}>
                {children}
            </I18nextProvider>
        </Provider>
    </QueryClientProvider>
);

describe('OfficialImages', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockUseState.mockImplementation((path: string[]) => {
            const pathStr = path.join('.');
            switch(pathStr) {
                case 'aws.region':
                    return 'us-east-1';
                case 'app.selectedRegion':
                    return 'us-east-1';
                case 'app.version.full':
                    return ['3.12.0', '3.8.0', '3.9.0'];
                case 'app.officialImages.selectedVersion':
                    return '3.12.0';
                default:
                    return null;
            }
        });

        (ListOfficialImages as jest.Mock).mockResolvedValue(mockImages);
    });

    it('renders official images list', async () => {
        render(
            <MockProviders>
                <OfficialImages />
            </MockProviders>
        );

        await waitFor(() => {
            expect(screen.getByText('ami-123')).toBeTruthy();
        });

        expect(screen.getByText('AMI ID')).toBeTruthy();
        expect(screen.getByText('OS')).toBeTruthy();
        expect(screen.getByText('Architecture')).toBeTruthy();

        expect(screen.getByText('alinux2')).toBeTruthy();
        expect(screen.getByText('x86_64')).toBeTruthy();
        expect(screen.getByText('ami-456')).toBeTruthy();
        expect(screen.getByText('ubuntu2004')).toBeTruthy();
        expect(screen.getByText('arm64')).toBeTruthy();
    });

    it('handles version selection', async () => {
        render(
            <MockProviders>
                <OfficialImages />
            </MockProviders>
        );

        const versionSelect = screen.getByRole('button', {
            name: /3\.12\.0/i
        });
        await userEvent.click(versionSelect);

        const version2 = await screen.findByText('3.8.0');
        await userEvent.click(version2);

        expect(mockSetState).toHaveBeenCalledWith(
            ['app', 'officialImages', 'selectedVersion'],
            '3.8.0'
        );
    });

    it('handles text filtering', async () => {
        render(
            <MockProviders>
                <OfficialImages />
            </MockProviders>
        );

        await waitFor(() => {
            expect(screen.getByText('ami-123')).toBeTruthy();
        });

        const filterInput = screen.getByPlaceholderText(/filter/i);
        await userEvent.type(filterInput, 'alinux2');

        expect(screen.getByText('ami-123')).toBeTruthy();
        expect(screen.queryByText('ami-456')).toBeFalsy();
    });

});
