import {validateQueueName} from '../queues.validators'

describe('Given a queue name', () => {
  describe("when it's defined", () => {
    it('should be validated', () => {
      const queueName = 'Queue 0'
      expect(validateQueueName(queueName)).toEqual([true])
    })
  })

  describe("when it's blank", () => {
    it('should fail the validation', () => {
      expect(validateQueueName('')).toEqual([false, 'empty'])
    })
  })
})
