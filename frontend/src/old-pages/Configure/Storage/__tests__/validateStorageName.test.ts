import {validateStorageName} from '../storage.validators'

describe('Given a storage name', () => {
  describe("when it's more than 30 chars", () => {
    it('should fail the validation', () => {
      expect(validateStorageName(new Array(32).join('a'))).toEqual([
        false,
        'max_length',
      ])
    })
  })

  describe("when it's less than 30 chars", () => {
    it('should be validated', () => {
      expect(validateStorageName(new Array(30).join('a'))).toEqual([true])
    })
  })

  describe("when it's blank", () => {
    it('should fail the validation', () => {
      expect(validateStorageName('')).toEqual([false, 'empty'])
    })
  })

  describe("when the name is 'default'", () => {
    it('should fail the validation', () => {
      expect(validateStorageName('default')).toEqual([
        false,
        'forbidden_keyword',
      ])
    })
  })

  describe('when zero or more bad characters are given', () => {
    it('should fail the validation', () => {
      expect(validateStorageName(';')).toEqual([false, 'forbidden_chars'])
      expect(validateStorageName('``')).toEqual([false, 'forbidden_chars'])
      expect(validateStorageName('#')).toEqual([false, 'forbidden_chars'])
    })
  })

  describe('when no bad characters are given', () => {
    it('should be validated', () => {
      expect(validateStorageName('efs_4')).toEqual([true])
    })
  })
})
