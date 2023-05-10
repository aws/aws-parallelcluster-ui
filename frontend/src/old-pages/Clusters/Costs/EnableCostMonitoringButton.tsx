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

import {Box, Button, Modal, SpaceBetween} from '@cloudscape-design/components'
import React, {useCallback} from 'react'
import {Trans, useTranslation} from 'react-i18next'
import {notify} from '../../../model'
import {
  CostMonitoringActivationErrorKind,
  useActivateCostMonitoringMutation,
  useCostMonitoringStatus,
} from './costs.queries'
import {consoleDomain, useState} from '../../../store'
import {useFeatureFlag} from '../../../feature-flags/useFeatureFlag'

export function EnableCostMonitoringButton() {
  const {t} = useTranslation()
  const isCostMonitoringActive = useFeatureFlag('cost_monitoring')
  const defaultRegion = useState(['aws', 'region'])
  const region = useState(['app', 'selectedRegion']) || defaultRegion
  const [modalVisible, setModalVisible] = React.useState(false)

  const showModal = useCallback(() => {
    setModalVisible(true)
  }, [setModalVisible])

  const dismissModal = useCallback(() => {
    setModalVisible(false)
  }, [setModalVisible])

  const onActivationError = useCallback(
    (kind: CostMonitoringActivationErrorKind, message?: string) => {
      switch (kind) {
        case 'costExplorerCannotBeAccessed':
          showModal()
          break
        case 'genericError':
          notify(message, 'error')
          break
      }
    },
    [showModal],
  )

  const onActivationSuccess = useCallback(() => {
    notify(t('costMonitoring.activateButton.activationSuccess'))
  }, [t])

  const {data: costMonitoringStatus, isLoading} = useCostMonitoringStatus()
  const costMonitoringStatusMutation = useActivateCostMonitoringMutation(
    onActivationError,
    onActivationSuccess,
  )

  const onClick = useCallback(() => {
    costMonitoringStatusMutation.mutate()
  }, [costMonitoringStatusMutation])

  const domain = consoleDomain(region)
  const costExplorerHref = `${domain}/cost-management/home#/cost-explorer`

  if (isLoading || costMonitoringStatus || !isCostMonitoringActive) return null

  return (
    <>
      <Button
        onClick={onClick}
        loading={costMonitoringStatusMutation.isLoading}
      >
        {t('costMonitoring.activateButton.label')}
      </Button>
      {modalVisible && (
        <Modal
          onDismiss={dismissModal}
          visible={modalVisible}
          closeAriaLabel={t(
            'costMonitoring.enableCostExplorerModal.closeAriaLabel',
          )}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={dismissModal} variant="link">
                  {t('costMonitoring.enableCostExplorerModal.actions.cancel')}
                </Button>
                <Button
                  variant="primary"
                  iconName="external"
                  target="_blank"
                  href={costExplorerHref}
                  onClick={dismissModal}
                >
                  {t(
                    'costMonitoring.enableCostExplorerModal.actions.goToCostExplorer',
                  )}
                </Button>
              </SpaceBetween>
            </Box>
          }
          header={t('costMonitoring.enableCostExplorerModal.title')}
        >
          <Trans i18nKey="costMonitoring.enableCostExplorerModal.description" />
        </Modal>
      )}
    </>
  )
}
