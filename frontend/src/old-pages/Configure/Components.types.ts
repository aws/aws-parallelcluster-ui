export type Extension = {
  name: string
  path: string
  description: string
  args: {name: string; default?: string}[]
}

export type ActionsEditorProps = {
  basePath: string[]
  errorsPath: string[]
}

export type InstanceType = {
  type: string
  tags: string[]
}

export type InstanceGroup = InstanceType[]

export type InstanceTypeOption = {
  label: string
  value: string
  tags: string[]
}
