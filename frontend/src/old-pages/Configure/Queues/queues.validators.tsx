export const QUEUE_NAME_MAX_LENGTH = 25
export const queueNameErrorsMapping = {
  empty: 'wizard.queues.validation.emptyName',
  max_length: 'wizard.queues.validation.maxLengthName',
  forbidden_chars: 'wizard.queues.validation.forbiddenCharsName',
}
type QueueNameErrorKind = keyof typeof queueNameErrorsMapping

export function validateQueueName(
  name: string,
): [boolean, QueueNameErrorKind?] {
  if (!name) {
    return [false, 'empty']
  }
  if (name.length > QUEUE_NAME_MAX_LENGTH) {
    return [false, 'max_length']
  }
  if (!/^([a-z][a-z0-9-]+)$/.test(name)) {
    return [false, 'forbidden_chars']
  }
  return [true]
}
