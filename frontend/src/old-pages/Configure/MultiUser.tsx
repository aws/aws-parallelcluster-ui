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

// Fameworks
import * as React from 'react'

// UI Elements
import {
  Button,
  Container,
  ExpandableSection,
  FormField,
  Header,
  Input,
  SpaceBetween,
  CheckboxProps,
} from '@cloudscape-design/components'

// State
import {setState, useState, getState, clearState} from '../../store'

// Components
import {CheckboxWithHelpPanel, HelpTextInput} from './Components'
import {Trans, useTranslation} from 'react-i18next'
import TitleDescriptionHelpPanel from '../../components/help-panel/TitleDescriptionHelpPanel'
import InfoLink from '../../components/InfoLink'
import {NonCancelableEventHandler} from '@cloudscape-design/components/internal/events'

// Constants
const errorsPath = ['app', 'wizard', 'errors', 'multiUser']
const dsPath = ['app', 'wizard', 'config', 'DirectoryService']
const generateSshKeysPath = [...dsPath, 'GenerateSshKeysForUsers']

function multiUserValidate() {
  let valid = true

  const checkRequired = (key: any) => {
    const value = getState([...dsPath, key])
    if (!value || value === '') {
      console.log('invalid: ', key, 'setting: ', [...errorsPath, key])
      setState([...errorsPath, key], `You must specify a value for ${key}.`)
      valid = false
    } else {
      clearState([...errorsPath, key])
    }
  }

  checkRequired('DomainName')
  checkRequired('DomainAddr')
  checkRequired('PasswordSecretArn')
  checkRequired('DomainReadOnlyUser')

  return valid
}

function AdditionalSssdOptions() {
  const {t} = useTranslation()
  let additionalSssdConfigsErrors = useState([
    ...errorsPath,
    'additionalSssdConfigs',
  ])
  let additionalSssdConfigs =
    useState([...dsPath, 'AdditionalSssdConfigs']) || {}

  let key = useState(['app', 'wizard', 'multiUser', 'key'])
  let value = useState(['app', 'wizard', 'multiUser', 'value'])

  const addConfig = () => {
    if (!key || !value || key === '' || value === '') {
      setState(
        [...errorsPath, 'additionalSssdConfigs'],
        t('wizard.cluster.multiUser.sssdParameters.validation'),
      )
    } else {
      setState([...dsPath, 'AdditionalSssdConfigs', key || ''], value || '')
      clearState([...errorsPath, 'additionalSssdConfigs'])
    }
  }

  const removeConfig = (key: any) => {
    let config = {...additionalSssdConfigs}
    delete config[key]
    if (Object.keys(config).length === 0)
      clearState([...dsPath, 'AdditionalSssdConfigs'])
    else setState([...dsPath, 'AdditionalSssdConfigs'], config)
  }

  return (
    <>
      <SpaceBetween direction="vertical" size="xs">
        <FormField
          errorText={additionalSssdConfigsErrors}
          label={t('wizard.cluster.multiUser.sssdParameters.name')}
          description={t('wizard.cluster.multiUser.sssdParameters.description')}
        >
          <SpaceBetween size="s">
            <Input
              value={key}
              onChange={({detail}) =>
                setState(['app', 'wizard', 'multiUser', 'key'], detail.value)
              }
            />
            <Input
              value={value}
              onChange={({detail}) =>
                setState(['app', 'wizard', 'multiUser', 'value'], detail.value)
              }
            />
            <Button onClick={addConfig}>
              {t('wizard.cluster.multiUser.sssdParameters.addButton')}
            </Button>
          </SpaceBetween>
        </FormField>
        <SpaceBetween direction="vertical" size="xs">
          {Object.keys(additionalSssdConfigs).map((key, index) => (
            <div
              key={key}
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '16px',
                alignItems: 'center',
              }}
            >
              <div>
                {key}: {String(additionalSssdConfigs[key])}
              </div>
              <Button onClick={() => removeConfig(key)}>
                {t('wizard.cluster.multiUser.sssdParameters.removeButton')}
              </Button>
            </div>
          ))}
        </SpaceBetween>
      </SpaceBetween>
    </>
  )
}

function MultiUser() {
  const {t} = useTranslation()

  const generateSshKeys = useState(generateSshKeysPath)

  const onGenerateSshKeysChange: NonCancelableEventHandler<CheckboxProps.ChangeDetail> =
    React.useCallback(({detail}) => {
      setState(generateSshKeysPath, detail.checked)
    }, [])

  React.useEffect(() => {
    if (generateSshKeys === null) setState(generateSshKeysPath, true)
  }, [generateSshKeys])

  return (
    <Container
      header={
        <Header
          variant="h2"
          info={<InfoLink helpPanel={<MultiUserHelpPanel />} />}
        >
          {t('wizard.cluster.multiUser.title')}
        </Header>
      }
    >
      <SpaceBetween direction="vertical" size="s">
        <HelpTextInput
          name={t('wizard.cluster.multiUser.domainName.name')}
          path={dsPath}
          errorsPath={errorsPath}
          configKey={'DomainName'}
          description={t('wizard.cluster.multiUser.domainName.description')}
          placeholder={'dc=corp,dc=pcluster,dc=com'}
          help={t('wizard.cluster.multiUser.domainName.help')}
          onChange={({detail}) => {
            setState([...dsPath, 'DomainName'], detail.value)
          }}
        />
        <HelpTextInput
          name={t('wizard.cluster.multiUser.domainAddress.name')}
          path={dsPath}
          errorsPath={errorsPath}
          configKey={'DomainAddr'}
          description={t('wizard.cluster.multiUser.domainAddress.description')}
          placeholder={'ldaps://corp.pcluster.com'}
          help={t('wizard.cluster.multiUser.domainAddress.help')}
          onChange={({detail}) => {
            setState([...dsPath, 'DomainAddr'], detail.value)
          }}
        />
        <HelpTextInput
          name={t('wizard.cluster.multiUser.passwordSecretArn.name')}
          path={dsPath}
          errorsPath={errorsPath}
          configKey={'PasswordSecretArn'}
          description={t(
            'wizard.cluster.multiUser.passwordSecretArn.description',
          )}
          placeholder={
            'arn:aws:secretsmanager:region:000000000000:secret:secret_name'
          }
          help={t('wizard.cluster.multiUser.passwordSecretArn.help')}
          onChange={({detail}) => {
            setState([...dsPath, 'PasswordSecretArn'], detail.value)
          }}
        />
        <HelpTextInput
          name={t('wizard.cluster.multiUser.domainReadOnlyUser.name')}
          path={dsPath}
          errorsPath={errorsPath}
          configKey={'DomainReadOnlyUser'}
          description={t(
            'wizard.cluster.multiUser.domainReadOnlyUser.description',
          )}
          placeholder={
            'cn=ReadOnlyUser,ou=Users,ou=CORP,dc=corp,dc=pcluster,dc=com'
          }
          help={t('wizard.cluster.multiUser.domainReadOnlyUser.help')}
          onChange={({detail}) => {
            setState([...dsPath, 'DomainReadOnlyUser'], detail.value)
          }}
        />
        <ExpandableSection
          headerText={t('wizard.cluster.multiUser.advancedOptionsLabel')}
        >
          <SpaceBetween direction="vertical" size="s">
            <HelpTextInput
              name={t('wizard.cluster.multiUser.caCertificate.name')}
              path={dsPath}
              errorsPath={errorsPath}
              configKey={'LdapTlsCaCert'}
              description={t(
                'wizard.cluster.multiUser.caCertificate.description',
              )}
              placeholder={'/path/to/certificate.pem'}
              help={t('wizard.cluster.multiUser.caCertificate.help')}
              onChange={({detail}) => {
                setState([...dsPath, 'LdapTlsCaCert'], detail.value)
              }}
            />
            <HelpTextInput
              name={t('wizard.cluster.multiUser.requireCertificate.name')}
              path={dsPath}
              errorsPath={errorsPath}
              configKey={'LdapTlsReqCert'}
              description={t(
                'wizard.cluster.multiUser.requireCertificate.description',
              )}
              placeholder={'hard'}
              help={t('wizard.cluster.multiUser.requireCertificate.help')}
              onChange={({detail}) => {
                setState([...dsPath, 'LdapTlsReqCert'], detail.value)
              }}
            />
            <HelpTextInput
              name={t('wizard.cluster.multiUser.LDAPAccessFilter.name')}
              path={dsPath}
              errorsPath={errorsPath}
              configKey={'LdapAccessFilter'}
              description={t(
                'wizard.cluster.multiUser.LDAPAccessFilter.description',
              )}
              placeholder={
                'memberOf=cn=TeamOne,ou=Users,ou=CORP,dc=corp,dc=pcluster,dc=com'
              }
              help={t('wizard.cluster.multiUser.LDAPAccessFilter.help')}
              onChange={({detail}) => {
                setState([...dsPath, 'LdapAccessFilter'], detail.value)
              }}
            />
            <CheckboxWithHelpPanel
              checked={generateSshKeys}
              onChange={onGenerateSshKeysChange}
              helpPanel={
                <TitleDescriptionHelpPanel
                  title={t('wizard.cluster.multiUser.generateSSHKeys.name')}
                  description={
                    <Trans i18nKey="wizard.cluster.multiUser.generateSSHKeys.help" />
                  }
                />
              }
            >
              {t('wizard.cluster.multiUser.generateSSHKeys.name')}
            </CheckboxWithHelpPanel>
            <AdditionalSssdOptions />
          </SpaceBetween>
        </ExpandableSection>
      </SpaceBetween>
    </Container>
  )
}

export const MultiUserHelpPanel = () => {
  const {t} = useTranslation()
  const footerLinks = React.useMemo(
    () => [
      {
        title: t('wizard.cluster.multiUser.multiUserAccessLink.title'),
        href: t('wizard.cluster.multiUser.multiUserAccessLink.href'),
      },
      {
        title: t('wizard.cluster.multiUser.adLink.title'),
        href: t('wizard.cluster.multiUser.adLink.href'),
      },
      {
        title: t('wizard.cluster.multiUser.directoryServiceLink.title'),
        href: t('wizard.cluster.multiUser.directoryServiceLink.href'),
      },
    ],
    [t],
  )
  return (
    <TitleDescriptionHelpPanel
      title={t('wizard.cluster.multiUser.title')}
      description={<Trans i18nKey="wizard.cluster.multiUser.help" />}
      footerLinks={footerLinks}
    />
  )
}

export {MultiUser, multiUserValidate}
