type ErrorKind =
  | 'forbidden_keyword'
  | 'forbidden_chars'
  | 'max_length'
  | 'empty'

export const STORAGE_NAME_MAX_LENGTH = 30

export function validateStorageName(name: string): [boolean, ErrorKind?] {
  if (!name) {
    return [false, 'empty']
  }
  if (name.length > STORAGE_NAME_MAX_LENGTH) {
    return [false, 'max_length']
  }
  if (name === 'default') {
    return [false, 'forbidden_keyword']
  }
  if (!/^([\w\+\-\=\.\_\:\@/]{0,256})$/.test(name)) {
    return [false, 'forbidden_chars']
  }
  return [true]
}
