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
  Box,
  Button,
  ButtonProps,
  Modal,
  Select,
  SelectProps,
  SpaceBetween,
} from '@cloudscape-design/components'
import {
  CancelableEventHandler,
  NonCancelableEventHandler,
} from '@cloudscape-design/components/internal/events'
import React, {useCallback} from 'react'
import {useTranslation} from 'react-i18next'
import {useClustersToCopyFrom} from './useClustersToCopyFrom'

interface Props {
  visible: boolean
  onDismiss: () => void
  onCreate: (clusterName: string) => void
}

export const FromClusterModal: React.FC<Props> = ({
  visible,
  onDismiss,
  onCreate,
}) => {
  const {t} = useTranslation()
  const [selectedCluster, setSelectedCluster] =
    React.useState<SelectProps.Option | null>(null)
  const clustersToDisplay = useClustersToCopyFrom()

  const onChange: NonCancelableEventHandler<SelectProps.ChangeDetail> =
    useCallback(({detail}) => {
      setSelectedCluster(detail.selectedOption)
    }, [])

  const onCreateClick: CancelableEventHandler<ButtonProps.ClickDetail> =
    useCallback(() => {
      if (!selectedCluster?.value) {
        return
      }

      onCreate(selectedCluster.value)
      onDismiss()
    }, [onCreate, onDismiss, selectedCluster])

  return (
    <Modal
      onDismiss={onDismiss}
      visible={visible}
      closeAriaLabel={t('cluster.fromClusterModal.closeAriaLabel')}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={onDismiss} variant="link">
              {t('cluster.fromClusterModal.actions.cancel')}
            </Button>
            <Button
              disabled={!selectedCluster}
              variant="primary"
              onClick={onCreateClick}
            >
              {t('cluster.fromClusterModal.actions.create')}
            </Button>
          </SpaceBetween>
        </Box>
      }
      header={t('cluster.fromClusterModal.title')}
    >
      <SpaceBetween size="s">
        <Box>{t('cluster.fromClusterModal.description')}</Box>
        <Select
          selectedOption={selectedCluster}
          options={clustersToDisplay}
          onChange={onChange}
          placeholder={t('cluster.fromClusterModal.clusterSelect.placeholder')}
          selectedAriaLabel={t(
            'cluster.fromClusterModal.clusterSelect.selectedAriaLabel',
          )}
          empty={t('cluster.fromClusterModal.clusterSelect.empty')}
        />
      </SpaceBetween>
    </Modal>
  )
}
