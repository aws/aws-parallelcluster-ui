import {validateQueueName} from '../queues.validators'

describe('Given a queue name', () => {
  describe("when it's blank", () => {
    it('should fail the validation', () => {
      expect(validateQueueName('')).toEqual([false, 'empty'])
    })
  })

  describe("when it's more than 25 chars", () => {
    it('should fail the validation', () => {
      expect(validateQueueName(new Array(27).join('a'))).toEqual([
        false,
        'max_length',
      ])
    })
  })

  describe("when it's less than or equal to 25 chars", () => {
    it('should be validated', () => {
      expect(validateQueueName(new Array(25).join('a'))).toEqual([true])
    })
  })

  describe('when one or more bad characters are given', () => {
    it('should fail the validation', () => {
      expect(validateQueueName('_')).toEqual([false, 'forbidden_chars'])
      expect(validateQueueName('=')).toEqual([false, 'forbidden_chars'])
      expect(validateQueueName('A')).toEqual([false, 'forbidden_chars'])
      expect(validateQueueName('#')).toEqual([false, 'forbidden_chars'])
    })
  })

  describe('when no bad characters are given', () => {
    it('should be validated', () => {
      expect(validateQueueName('queue-0')).toEqual([true])
    })
  })
})
