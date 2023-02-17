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
//
import * as React from 'react'

// UI Elements
import {CodeEditor} from '@cloudscape-design/components'
import {useTranslation} from 'react-i18next'
import {useEffect, useMemo} from 'react'
import {CodeEditorProps} from '@cloudscape-design/components/code-editor/interfaces'
import {
  borderRadiusItem,
  colorBorderInputDefault,
} from '@cloudscape-design/design-tokens'

export default function ConfigView({config, pending, onChange}: any) {
  const {t} = useTranslation()
  const [preferences, setPreferences] = React.useState({
    theme: 'textmate',
  } as Partial<CodeEditorProps.Preferences>)

  const i18nStrings = useMemo(
    () => ({
      loadingState: t('cluster.codeEditor.loading'),
      errorState: t('cluster.codeEditor.loadingError'),
      errorStateRecovery: t('cluster.codeEditor.errorStateRecovery'),
      editorGroupAriaLabel: t('cluster.codeEditor.editorGroupAriaLabel'),
      statusBarGroupAriaLabel: t('cluster.codeEditor.statusBarGroupAriaLabel'),
      cursorPosition: (row: any, column: any) =>
        `${t('cluster.codeEditor.line')} ${row}, ${t(
          'cluster.codeEditor.column',
        )} ${column}`,
      errorsTab: t('cluster.codeEditor.errorsTab'),
      warningsTab: t('cluster.codeEditor.warningsTab'),
      preferencesButtonAriaLabel: t(
        'cluster.codeEditor.preferencesButtonAriaLabel',
      ),
      paneCloseButtonAriaLabel: t(
        'cluster.codeEditor.paneCloseButtonAriaLabel',
      ),
      preferencesModalHeader: t('cluster.codeEditor.preferencesModalHeader'),
      preferencesModalCancel: t('cluster.codeEditor.preferencesModalCancel'),
      preferencesModalConfirm: t('cluster.codeEditor.preferencesModalConfirm'),
      preferencesModalWrapLines: t(
        'cluster.codeEditor.preferencesModalWrapLines',
      ),
      preferencesModalTheme: t('cluster.codeEditor.preferencesModalTheme'),
      preferencesModalLightThemes: t(
        'cluster.codeEditor.preferencesModalLightThemes',
      ),
      preferencesModalDarkThemes: t(
        'cluster.codeEditor.preferencesModalDarkThemes',
      ),
    }),
    [t],
  )

  return (
    <CodeEditor
      ace={window.ace}
      language="yaml"
      value={config || ''}
      onChange={e => {}}
      onDelayedChange={onChange}
      preferences={preferences}
      onPreferencesChange={e => setPreferences(e.detail)}
      onValidate={e => {}}
      loading={pending ? true : false}
      i18nStrings={i18nStrings}
    />
  )
}

export function ReadonlyConfigView({config}: any) {
  useEffect(() => {
    if (config) {
      const editor = window.ace.edit('customImageConfig', {
        mode: 'ace/mode/yaml',
      })
      editor.setReadOnly(true)
      editor.setValue(config.trim())
      editor.setHighlightActiveLine(true)
      editor.gotoLine(0, 0, false)
      editor.setTheme('ace/theme/textmate')
    }
  }, [config])

  return (
    <div id="customImageConfig">
      <style jsx>{`
        #customImageConfig {
          font-size: 14px;
          min-height: 380px;
          width: 100%;
          max-width: 800px;
          border: ${colorBorderInputDefault} solid 2px;
          border-radius: ${borderRadiusItem};
        }
      `}</style>
    </div>
  )
}
