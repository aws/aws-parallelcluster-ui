type ErrorLevel = 'INFO' | 'WARNING' | 'ERROR'

export type ConfigError = {
  id: string
  type: string
  level: ErrorLevel
  message: string
}

export type UpdateError = {
  parameter: string
  currentValue: string
  requestedValue: string
  message: string
}

export type CreateErrors = {
  message: string
  validationMessages?: ConfigError[]
  configurationValidationErrors?: ConfigError[]
  updateValidationErrors?: UpdateError[]
}
