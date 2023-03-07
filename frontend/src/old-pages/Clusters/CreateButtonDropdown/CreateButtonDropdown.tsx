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

import {
  ButtonDropdown,
  ButtonDropdownProps,
} from '@cloudscape-design/components'
import {CancelableEventHandler} from '@cloudscape-design/components/internal/events'
import React, {useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {NavigateFunction, useNavigate} from 'react-router-dom'

interface Props {
  openWizard: (navigate: NavigateFunction) => void
}

export const CreateButtonDropdown: React.FC<Props> = ({openWizard}) => {
  const {t} = useTranslation()

  const navigate = useNavigate()

  const onCreateClick: CancelableEventHandler<ButtonDropdownProps.ItemClickDetails> =
    React.useCallback(
      ({detail}) => {
        switch (detail.id) {
          case 'wizard':
            openWizard(navigate)
            return
        }
      },
      [navigate, openWizard],
    )

  const createDropdownItems: ButtonDropdownProps.Item[] = useMemo(
    () => [
      {
        id: 'wizard',
        text: t('cluster.list.actions.createFromWizard'),
      },
    ],
    [t],
  )

  return (
    <>
      <ButtonDropdown
        variant="primary"
        items={createDropdownItems}
        onItemClick={onCreateClick}
      >
        {t('cluster.list.actions.create')}
      </ButtonDropdown>
    </>
  )
}
