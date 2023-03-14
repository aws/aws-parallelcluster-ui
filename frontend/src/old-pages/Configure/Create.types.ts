type ErrorLevel = 'INFO' | 'WARNING' | 'ERROR'

export type ConfigError = {
  id: string
  type: string
  level: ErrorLevel
  message: string
}

export type UpdateError = {
  message: string
  level: ErrorLevel
}

export type CreateErrors = {
  message: string
  validationMessages?: ConfigError[]
  configurationValidationErrors?: ConfigError[]
  updateValidationErrors?: UpdateError[]
}
