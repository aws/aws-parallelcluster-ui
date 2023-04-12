import {formatStatus} from '../Status'

describe('Given a resource status', () => {
  describe('when the status has a dash', () => {
    it('should be removed', () => {
      expect(formatStatus('shutting-down')).toBe('Shutting down')
    })
  })

  describe('when the status has an underscore', () => {
    it('should be removed', () => {
      expect(formatStatus('shutting_down')).toBe('Shutting down')
    })
  })

  describe('when the status is lowercase', () => {
    it('should be capitalized', () => {
      expect(formatStatus('created')).toBe('Created')
    })
  })

  describe('when the status is uppercase', () => {
    it('should be capitalized', () => {
      expect(formatStatus('CREATE_COMPLETE')).toBe('Create complete')
    })
  })

  describe('when given an undefined string', () => {
    it('should return an empty string', () => {
      expect(formatStatus()).toBe('')
    })
  })
})
