import {FlashbarProps} from '@cloudscape-design/components'
import i18next from 'i18next'
import {capitalize} from 'lodash'
import {ConfigError, CreateErrors, UpdateError} from './Create.types'

const priority: FlashbarProps.Type[] = ['error', 'success', 'warning', 'info']

function dismissableMessage(
  messageDefinition: FlashbarProps.MessageDefinition,
  setFlashbarItems: React.Dispatch<
    React.SetStateAction<FlashbarProps.MessageDefinition[]>
  >,
): FlashbarProps.MessageDefinition {
  return {
    ...messageDefinition,
    dismissible: true,
    onDismiss: () =>
      setFlashbarItems(items =>
        items.filter(item => item.id !== messageDefinition.id),
      ),
  }
}

function compareFlashbarItems(
  itemA: FlashbarProps.MessageDefinition,
  itemB: FlashbarProps.MessageDefinition,
): number {
  const itemAPriority = priority.indexOf(itemA.type!)
  const itemBPriority = priority.indexOf(itemB.type!)

  if (itemAPriority > itemBPriority) return 1
  if (itemAPriority < itemBPriority) return -1
  else return 0
}

export function errorsToFlashbarItems(
  errors: CreateErrors,
  setFlashbarItems: React.Dispatch<
    React.SetStateAction<FlashbarProps.MessageDefinition[]>
  >,
) {
  let items: FlashbarProps.MessageDefinition[] = []

  if (!errors) return items

  const success = errors.message && errors.message.includes('succeeded')
  const configErrors =
    errors.configurationValidationErrors || errors.validationMessages
  const updateErrors = errors.updateValidationErrors

  if (success) {
    items.push(
      dismissableMessage(
        {
          type: 'success',
          header: i18next.t('wizard.create.flashBar.success'),
          content: errors.message,
          id: 'success',
        },
        setFlashbarItems,
      ),
    )
  }

  configErrors?.forEach((error: ConfigError, index: number) => {
    items.push(
      dismissableMessage(
        {
          type: error.level.toLowerCase() as FlashbarProps.Type,
          header: capitalize(error.level.toLowerCase()),
          content: `${error.type}: ${error.message}`,
          id: `config-err-${index}`,
        },
        setFlashbarItems,
      ),
    )
  })

  updateErrors?.forEach((error: UpdateError, index: number) => {
    items.push(
      dismissableMessage(
        {
          type: 'error',
          header: i18next.t('wizard.create.flashBar.error'),
          content: error.message,
          id: `update-err-${index}`,
        },
        setFlashbarItems,
      ),
    )
  })

  if (items.length === 0 && !success) {
    items.push(
      dismissableMessage(
        {
          type: 'error',
          header: i18next.t('wizard.create.flashBar.error'),
          content: errors.message,
          id: 'config-err-0',
        },
        setFlashbarItems,
      ),
    )
  }

  items.sort(compareFlashbarItems)
  return items
}
