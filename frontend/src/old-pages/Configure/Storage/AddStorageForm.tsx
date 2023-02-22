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
import {useTranslation} from 'react-i18next'
import {NonCancelableEventHandler} from '@cloudscape-design/components/internal/events'
import {
  Button,
  FormField,
  SpaceBetween,
  Multiselect,
  MultiselectProps,
} from '@cloudscape-design/components'
import {StorageType} from '../Storage.types'
import {useMemo} from 'react'
import {StorageTypeOption, itemToOption} from '../Storage'

interface Props {
  storageTypes: StorageTypeOption[]
  onSubmit: (storageTypes: StorageType[]) => void
}

const INITIAL_SELECTED_STORAGES: MultiselectProps.Option[] = []

export function AddStorageForm({storageTypes, onSubmit}: Props) {
  const {t} = useTranslation()
  const [selectedStorages, setSelectedStorages] = React.useState<
    MultiselectProps.Option[]
  >(INITIAL_SELECTED_STORAGES)
  const isAddStorageDisabled = selectedStorages.length < 1
  const storageTypesToDisplay = useMemo(
    () => storageTypes.map(itemToOption),
    [storageTypes],
  )

  const onAddStorageClick = React.useCallback(() => {
    const selectedStorageTypes = selectedStorages.map(
      selectedStorage => selectedStorage.value as StorageType,
    )
    onSubmit(selectedStorageTypes)
    setSelectedStorages(INITIAL_SELECTED_STORAGES)
  }, [onSubmit, selectedStorages])

  const onSelectChange: NonCancelableEventHandler<MultiselectProps.MultiselectChangeDetail> =
    React.useCallback(({detail: {selectedOptions}}) => {
      setSelectedStorages([...selectedOptions])
    }, [])

  return (
    <SpaceBetween size="s">
      <FormField label={t('wizard.storage.container.storageType')}>
        <Multiselect
          tokenLimit={0}
          placeholder={t('wizard.storage.container.storageTypePlaceholder')}
          selectedOptions={selectedStorages}
          onChange={onSelectChange}
          options={storageTypesToDisplay}
        />
      </FormField>
      <Button onClick={onAddStorageClick} disabled={isAddStorageDisabled}>
        {t('wizard.storage.container.addStorage')}
      </Button>
    </SpaceBetween>
  )
}
