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

// UI Elements
import {Box, Button, Modal, SpaceBetween} from '@cloudscape-design/components'

import {UpdateComputeFleet} from '../../model'
import {setState, useState} from '../../store'
import {useTranslation} from 'react-i18next'

function StopDialog({clusterName}: any) {
  const open = useState(['app', 'clusters', 'clusterStop', 'dialog'])
  const {t} = useTranslation()

  const cancel = () => {
    setState(['app', 'clusters', 'clusterStop', 'dialog'], false)
  }

  const stopCluster = () => {
    UpdateComputeFleet(clusterName, 'STOP_REQUESTED')
    cancel()
  }

  return (
    <Modal
      onDismiss={cancel}
      visible={open}
      closeAriaLabel="Close modal"
      size="medium"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={cancel}>{t('cluster.list.actions.cancel')}</Button>
            <Button onClick={stopCluster}>
              {t('cluster.list.actions.stop')}
            </Button>
          </SpaceBetween>
        </Box>
      }
      header={t('cluster.list.dialogs.stop.title')}
    >
      {t('cluster.list.dialogs.stop.body', {clusterName: clusterName})}
    </Modal>
  )
}

function stopComputeFleet() {
  setState(['app', 'clusters', 'clusterStop', 'dialog'], true)
}

export {StopDialog, stopComputeFleet}
