import React from 'react';
import {render, screen, fireEvent, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../../i18n';
import ImageBuildDialog from '../ImageBuildDialog';
import { BuildImage } from '../../../../model';
import {act} from "react-dom/test-utils";

jest.mock('../../../../model', () => ({
    BuildImage: jest.fn(),
}));


const mockUseState = jest.fn()
const mockSetState = jest.fn()
const mockGetState = jest.fn()
const mockClearState = jest.fn()


jest.mock('../../../../store', () => ({
    ...(jest.requireActual('../../../../store') as any),
    setState: (...args: unknown[]) => mockSetState(...args),
    useState: (...args: unknown[]) => mockUseState(...args),
    getState: (...args: unknown[]) => mockGetState(...args),
    clearState: (...args: unknown[]) => mockClearState(...args),

}))


jest.mock('../../../../components/FileChooser', () => ({
    __esModule: true,
    default: () => <button>Upload File</button>,
}));

describe('ImageBuildDialog', () => {
    beforeEach(() => {
        mockUseState.mockReturnValue(['3.12.0', '3.6.0', '3.7.0'])

    });

    it('renders correctly when open', () => {
        render(
            <I18nextProvider i18n={i18n}>
                <ImageBuildDialog />
            </I18nextProvider>
        );

        expect(screen.getByText('Build image')).toBeTruthy();
        expect(screen.getByPlaceholderText('Enter image AMI ID')).toBeTruthy();
        expect(screen.getByText('Upload File')).toBeTruthy();
    });

    it('handles image ID input', async () => {
        render(
            <I18nextProvider i18n={i18n}>
                <ImageBuildDialog />
            </I18nextProvider>
        );

        const input = screen.getByPlaceholderText('Enter image AMI ID');

        await act(async () => {
            fireEvent.change(input, {
                target: { value: 'test-image-id' },
                detail: { value: 'test-image-id' },
                bubbles: true,
            });
        });

        await waitFor(() => {
            expect(mockSetState).toHaveBeenCalledWith(
                ['app', 'customImages', 'imageBuild', 'imageId'],
                'test-image-id'
            );
        });
    });

    it('handles version selection', async () => {
        render(
            <I18nextProvider i18n={i18n}>
                <ImageBuildDialog />
            </I18nextProvider>
        );

        const versionSelect = screen.getByLabelText('Version');
        await userEvent.click(versionSelect);

        const version = await screen.findByText('3.7.0');
        await userEvent.click(version);

        expect(screen.getByText('3.7.0')).toBeTruthy();

        await userEvent.click(versionSelect);

        const version2 = await screen.findByText('3.12.0');
        await userEvent.click(version2);

        expect(screen.getByText('3.12.0')).toBeTruthy();

    });

    it('handles build button click', async () => {
        (mockUseState as jest.Mock).mockImplementation((path) => {
            if (path.join('.') === 'app.version.full') return ['3.12.0', '3.6.0', '3.7.0'];
            if (path.join('.') === 'app.customImages.imageBuild.imageId') return 'test-image-id'
            if (path.join('.') === 'app.customImages.imageBuild.config') return 'test-config';

            return null;
        });

        mockGetState.mockImplementation((path: string[]) => {
            if (Array.isArray(path)) {
                switch (path.join('.')) {
                    case 'app.customImages.imageBuild.imageId':
                        return 'test-image-id';
                    case 'app.customImages.imageBuild.config':
                        return 'test-config';
                }
            }
            return undefined;
        });

        render(
            <I18nextProvider i18n={i18n}>
                <ImageBuildDialog />
            </I18nextProvider>
        );

        const buildButton = screen.getByText('Build image');
        expect(buildButton).toBeTruthy();

        await act(async () => {
            await userEvent.click(buildButton);
        });

        await waitFor(() => {
            expect(BuildImage).toHaveBeenCalledWith('test-image-id', 'test-config', '3.12.0');
        });
    });

    it('closes the dialog', async () => {
        render(
            <I18nextProvider i18n={i18n}>
                <ImageBuildDialog />
            </I18nextProvider>
        );

        const cancelButton = screen.getByText('Cancel');
        await userEvent.click(cancelButton);

        expect(mockSetState).toHaveBeenCalledWith(['app', 'customImages', 'imageBuild', 'dialog'], false);
        expect(mockClearState).toHaveBeenCalledWith(['app', 'customImages', 'imageBuild', 'errors']);
    });
});
