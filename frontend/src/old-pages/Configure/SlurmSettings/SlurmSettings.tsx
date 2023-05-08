// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
// with the License. A copy of the License is located at
//
// http://aws.amazon.com/apache2.0/
//
// or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
// limitations under the License.

import * as React from 'react'
import i18next from 'i18next'
import {Trans, useTranslation} from 'react-i18next'
import {ExpandableSection, Header} from '@cloudscape-design/components'
import {setState, getState, clearState} from '../../../store'
import {SlurmAccountingForm} from './SlurmAccountingForm'
import TitleDescriptionHelpPanel from '../../../components/help-panel/TitleDescriptionHelpPanel'
import InfoLink from '../../../components/InfoLink'
import {useFeatureFlag} from '../../../feature-flags/useFeatureFlag'

const slurmSettingsPath = [
  'app',
  'wizard',
  'config',
  'Scheduling',
  'SlurmSettings',
]
const errorsPath = ['app', 'wizard', 'errors', 'headNode', 'slurmSettings']

const uriPath = [...slurmSettingsPath, 'Database', 'Uri']
const usernamePath = [...slurmSettingsPath, 'Database', 'UserName']
const passwordPath = [...slurmSettingsPath, 'Database', 'PasswordSecretArn']
const uriErrorPath = [...errorsPath, 'database', 'uri']
const usernameErrorPath = [...errorsPath, 'database', 'username']
const passwordErrorPath = [...errorsPath, 'database', 'password']

function slurmAccountingValidateAndSetErrors(): boolean {
  const errorMask: Array<boolean> = [uriPath, usernamePath, passwordPath].map(
    path => slurmAccountingValidateField(getState(path)),
  )
  const errorPaths: Array<Array<string>> = [
    uriErrorPath,
    usernameErrorPath,
    passwordErrorPath,
  ]
  const errorValues: Array<string> = [
    i18next.t('wizard.headNode.slurmSettings.validation.databaseCannotBeEmpty'),
    i18next.t('wizard.headNode.slurmSettings.validation.usernameCannotBeEmpty'),
    i18next.t('wizard.headNode.slurmSettings.validation.passwordCannotBeEmpty'),
  ]

  if (errorMask.every(e => e)) {
    return true
  } else if (errorMask.every(e => !e)) {
    clearState([...slurmSettingsPath, 'Database'])
    return true
  } else {
    slurmAccountingSetErrors(errorMask, errorPaths, errorValues)
    return false
  }
}

function slurmAccountingValidateField(field: string | undefined): boolean {
  return field ? true : false
}

function slurmAccountingSetErrors(
  errorMask: Array<boolean>,
  errorPaths: Array<Array<string>>,
  errorValues: Array<string>,
) {
  errorMask.forEach((err, idx) =>
    err
      ? clearState(errorPaths[idx])
      : setState(errorPaths[idx], errorValues[idx]),
  )
}

function SlurmSettings() {
  const {t} = useTranslation()

  const isSlurmAccountingEnabled = useFeatureFlag('slurm_accounting')

  if (!isSlurmAccountingEnabled) return null

  return (
    <ExpandableSection
      variant="container"
      headerText={t('wizard.headNode.slurmSettings.container.title')}
      headerDescription={t(
        'wizard.headNode.slurmSettings.container.description',
      )}
    >
      <SlurmAccountingForm
        uriPath={uriPath}
        uriErrorPath={uriErrorPath}
        usernamePath={usernamePath}
        usernameErrorPath={usernameErrorPath}
        passwordPath={passwordPath}
        passwordErrorPath={passwordErrorPath}
      />
    </ExpandableSection>
  )
}

export {
  SlurmSettings,
  slurmAccountingValidateAndSetErrors,
  slurmAccountingValidateField,
  slurmAccountingSetErrors,
}
