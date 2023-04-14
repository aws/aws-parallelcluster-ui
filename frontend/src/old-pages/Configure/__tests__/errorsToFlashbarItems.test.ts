import {FlashbarProps} from '@cloudscape-design/components'
import {ClickDetail} from '@cloudscape-design/components/internal/events'
import {describe} from '@jest/globals'
import {ConfigError, CreateErrors, UpdateError} from '../Create.types'
import i18n from '../../../i18n'
import {initReactI18next} from 'react-i18next'
import {errorsToFlashbarItems} from '../errorsToFlashbarItems'

i18n.use(initReactI18next).init({
  resources: {},
  lng: 'en',
})

describe('Given a function to map create/dry-run errors to FlashbarItems', () => {
  let setFlashbarItems = jest.fn()
  beforeEach(() => {
    setFlashbarItems.mockReset()
  })

  describe('when errors contain "succeeded" in the error message', () => {
    const errors: CreateErrors = {
      message: 'Request would have succeeded, but DryRun flag is set.',
    }

    it('should return an item of type "success" with the error message as content', () => {
      const expected: FlashbarProps.MessageDefinition[] = [
        {
          type: 'success',
          dismissible: true,
          header: 'wizard.create.flashBar.success',
          content: errors.message,
          id: 'success',
        },
      ]
      expect(errorsToFlashbarItems(errors, setFlashbarItems)).toMatchObject(
        expected,
      )
    })
  })

  describe('when errors contain "succeed" in the error message, and validation errors too', () => {
    const validationMessages: ConfigError[] = [
      {
        id: 'Id1',
        level: 'WARNING',
        type: 'Validation',
        message: 'WarningMessage',
      },
    ]
    const errors: CreateErrors = {
      message: 'Request would have succeeded, but DryRun flag is set.',
      validationMessages: validationMessages,
    }

    it('should return both success and error items, with expected type and content', () => {
      const expected: FlashbarProps.MessageDefinition[] = [
        {
          type: 'success',
          dismissible: true,
          header: 'wizard.create.flashBar.success',
          content: errors.message,
          id: 'success',
        },
        {
          type: 'warning',
          dismissible: true,
          header: 'Warning',
          content: `${validationMessages[0].type}: ${validationMessages[0].message}`,
          id: 'config-err-0',
        },
      ]
      expect(errorsToFlashbarItems(errors, setFlashbarItems)).toMatchObject(
        expected,
      )
    })
  })

  describe('when errors contain configuration errors', () => {
    const configErrors: ConfigError[] = [
      {
        id: 'Id1',
        level: 'ERROR',
        type: 'Type',
        message: 'ErrorMessage',
      },
      {
        id: 'Id2',
        level: 'WARNING',
        type: 'Type',
        message: 'WarningMessage',
      },
    ]
    const errors: CreateErrors = {
      message: 'Invalid cluster configuration',
      configurationValidationErrors: configErrors,
    }

    it('should return one item per error with the expected type, header and content', () => {
      const expected: FlashbarProps.MessageDefinition[] = [
        {
          type: 'error',
          dismissible: true,
          header: 'Error',
          content: `${configErrors[0].type}: ${configErrors[0].message}`,
          id: 'config-err-0',
        },
        {
          type: 'warning',
          dismissible: true,
          header: 'Warning',
          content: `${configErrors[1].type}: ${configErrors[1].message}`,
          id: 'config-err-1',
        },
      ]
      expect(errorsToFlashbarItems(errors, setFlashbarItems)).toMatchObject(
        expected,
      )
    })

    describe('when one configuration error is dismissed', () => {
      it('should remove the error from the list of visible items', () => {
        const items = errorsToFlashbarItems(errors, setFlashbarItems)
        const onDismiss = items[0].onDismiss!
        onDismiss(new CustomEvent<ClickDetail>('click'))

        const filterPredicate = setFlashbarItems.mock.calls[0][0]
        expect(filterPredicate(items)).toEqual([
          expect.objectContaining({
            type: 'warning',
            dismissible: true,
            header: 'Warning',
            content: `${configErrors[1].type}: ${configErrors[1].message}`,
            id: 'config-err-1',
          }),
        ])
      })
    })
  })

  describe('when errors contain validation messages', () => {
    const configErrors: ConfigError[] = [
      {
        id: 'Id1',
        level: 'ERROR',
        type: 'Type',
        message: 'ErrorMessage',
      },
      {
        id: 'Id2',
        level: 'WARNING',
        type: 'Type',
        message: 'WarningMessage',
      },
    ]
    const errors: CreateErrors = {
      message: 'Invalid cluster configuration',
      validationMessages: configErrors,
    }

    it('should return one item per error with the expected type, header and content', () => {
      const expected: FlashbarProps.MessageDefinition[] = [
        {
          type: 'error',
          dismissible: true,
          header: 'Error',
          content: `${configErrors[0].type}: ${configErrors[0].message}`,
          id: 'config-err-0',
        },
        {
          type: 'warning',
          dismissible: true,
          header: 'Warning',
          content: `${configErrors[1].type}: ${configErrors[1].message}`,
          id: 'config-err-1',
        },
      ]
      expect(errorsToFlashbarItems(errors, setFlashbarItems)).toMatchObject(
        expected,
      )
    })
  })

  describe('when errors contain update errors', () => {
    const updateErrors: UpdateError[] = [
      {
        message: 'ErrorMessage',
        parameter: '',
        currentValue: '',
        requestedValue: '',
      },
    ]
    const errors: CreateErrors = {
      message: 'Invalid cluster configuration',
      updateValidationErrors: updateErrors,
    }

    it('should return one item per error with the expected type, header and content', () => {
      const expected: FlashbarProps.MessageDefinition[] = [
        {
          type: 'error',
          dismissible: true,
          header: 'wizard.create.flashBar.error',
          content: updateErrors[0].message,
          id: 'update-err-0',
        },
      ]
      expect(errorsToFlashbarItems(errors, setFlashbarItems)).toMatchObject(
        expected,
      )
    })
  })

  describe('when errors contain messages with different types', () => {
    const configErrors: ConfigError[] = [
      {
        level: 'INFO',
        message: 'InfoMessage',
        id: '0',
        type: '',
      },
      {
        level: 'ERROR',
        message: 'ErrorMessage',
        id: '1',
        type: '',
      },
      {
        level: 'WARNING',
        message: 'WarningMessage',
        id: '2',
        type: '',
      },
    ]
    const errors: CreateErrors = {
      message: 'Invalid cluster configuration',
      configurationValidationErrors: configErrors,
    }

    it('should return items ordered by the following priority: ["error", "success", "warning", "info"]', () => {
      const expected: FlashbarProps.MessageDefinition[] = [
        {
          type: 'error',
          dismissible: true,
          header: 'Error',
        },
        {
          type: 'warning',
          dismissible: true,
          header: 'Warning',
        },
        {
          type: 'info',
          dismissible: true,
          header: 'Info',
        },
      ]
      expect(errorsToFlashbarItems(errors, setFlashbarItems)).toMatchObject(
        expected,
      )
    })
  })

  describe('when errors contain messages with different types, including a success message', () => {
    const configErrors: ConfigError[] = [
      {
        level: 'INFO',
        message: 'InfoMessage',
        id: '0',
        type: 'Type',
      },
      {
        level: 'ERROR',
        message: 'ErrorMessage',
        id: '1',
        type: 'Type',
      },
      {
        level: 'WARNING',
        message: 'WarningMessage',
        id: '2',
        type: 'Type',
      },
    ]
    const errors: CreateErrors = {
      message: 'Request would have succeeded, but DryRun flag is set.',
      configurationValidationErrors: configErrors,
    }

    it('should return items ordered by the following priority: ["error", "success", "warning", "info"]', () => {
      const expected: FlashbarProps.MessageDefinition[] = [
        {
          type: 'error',
          dismissible: true,
          header: 'Error',
        },
        {
          type: 'success',
          dismissible: true,
          header: 'wizard.create.flashBar.success',
          id: 'success',
        },
        {
          type: 'warning',
          dismissible: true,
          header: 'Warning',
        },
        {
          type: 'info',
          dismissible: true,
          header: 'Info',
        },
      ]
      expect(errorsToFlashbarItems(errors, setFlashbarItems)).toMatchObject(
        expected,
      )
    })
  })

  describe('when the request has errored without any specific configuration, validation or update errors', () => {
    it('should present an error with the error message', () => {
      expect(
        errorsToFlashbarItems(
          {
            message:
              'Bad Request: Configuration must be a valid YAML document. Parsed config is not a dict',
          },
          () => null,
        ),
      ).toMatchObject([
        {
          type: 'error',
          dismissible: true,
          header: 'wizard.create.flashBar.error',
          content:
            'Bad Request: Configuration must be a valid YAML document. Parsed config is not a dict',
        },
      ])
    })
  })
})
