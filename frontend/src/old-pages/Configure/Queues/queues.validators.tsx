export const queueNameErrorsMapping = {
  empty: 'wizard.queues.validation.emptyName',
}
type QueueNameErrorKind = keyof typeof queueNameErrorsMapping

export function validateQueueName(
  name: string,
): [boolean, QueueNameErrorKind?] {
  if (!name) {
    return [false, 'empty']
  }
  return [true]
}
