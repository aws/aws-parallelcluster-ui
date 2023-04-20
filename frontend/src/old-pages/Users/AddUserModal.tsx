import {
  Modal,
  Box,
  SpaceBetween,
  Button,
  FormField,
  Input,
} from '@cloudscape-design/components'
import {clear} from 'console'
import {t} from 'i18next'
import React from 'react'
import {useCallback} from 'react'
import {CreateUser} from '../../model'
import {setState, clearState, useState} from '../../store'

const usernamePath = ['app', 'users', 'newUser', 'Username']
const errorsPath = ['app', 'users', 'errors']

type UserModalProps = {
  visible: boolean
  setVisible: React.Dispatch<React.SetStateAction<boolean>>
}

export default function AddUserModal({visible, setVisible}: UserModalProps) {
  const username = useState(usernamePath)
  const newUser = useState(['app', 'users', 'newUser'])
  const newUserError = useState([...errorsPath, 'newUser'])
  const [createUserInputValidated, setCreateUserInputValidated] =
    React.useState(true)

  const onUserChange = useCallback(({detail}) => {
    setState(usernamePath, detail.value)
    clearState([...errorsPath, 'newUser'])
    setCreateUserInputValidated(true)
  }, [])

  const createUserCallback = useCallback(() => {
    clearState([...errorsPath, 'newUser'])
    clearState(['app', 'users', 'newUser'])
  }, [])

  const createUser = useCallback(() => {
    const validated = validateUser(username)
    setCreateUserInputValidated(validated)

    if (validated) {
      CreateUser(newUser, createUserCallback)
      setVisible(false)
    } else {
      setState([...errorsPath, 'newUser'], t('users.errors.invalidEmail'))
    }
  }, [newUser, setVisible, username, createUserCallback])

  return (
    <Modal
      onDismiss={() => setVisible(false)}
      visible={visible}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => setVisible(false)}>
              {t('users.actions.cancel')}
            </Button>
            <Button variant="primary" onClick={createUser}>
              {t('users.actions.add')}
            </Button>
          </SpaceBetween>
        </Box>
      }
      header={t('users.actions.add')}
    >
      <FormField
        label={t('users.list.createModal.emailLabel')}
        errorText={newUserError}
      >
        <Input
          onChange={onUserChange}
          invalid={!createUserInputValidated}
          value={username}
          placeholder={t('users.list.createModal.emailPlaceholder')}
        />
      </FormField>
    </Modal>
  )
}

export function validateUser(username: string) {
  const regex = /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9_.-]+\.([a-zA-Z0-9]{2,4})$/
  return regex.test(username)
}
