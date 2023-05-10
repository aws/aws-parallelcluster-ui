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
import {ClusterStatus} from '../../types/clusters'
import React from 'react'
import {useNavigate} from 'react-router-dom'

import {setState, useState, ssmPolicy, consoleDomain} from '../../store'
import {UpdateComputeFleet, GetDcvSession, DeleteCluster} from '../../model'
import {findFirst, clusterDefaultUser} from '../../util'
import {useTranslation} from 'react-i18next'

import Button from '@cloudscape-design/components/button'
import SpaceBetween from '@cloudscape-design/components/space-between'

import {
  DeleteDialog,
  showDialog,
  hideDialog,
} from '../../components/DeleteDialog'
import {StopDialog, stopComputeFleet} from './StopDialog'
import {CreateButtonDropdown} from './CreateButtonDropdown/CreateButtonDropdown'
import {wizardShow} from '../Configure/Configure'
import {ButtonDropdown} from '@cloudscape-design/components'
import {CancelableEventHandler} from '@cloudscape-design/components/internal/events'
import {ButtonDropdownProps} from '@cloudscape-design/components/button-dropdown/interfaces'
import {loadTemplateFromCluster} from '../Configure/util'

export default function Actions() {
  const clusterName = useState(['app', 'clusters', 'selected'])
  const clusterPath = ['clusters', 'index', clusterName]
  const cluster = useState(clusterPath)
  const defaultRegion = useState(['aws', 'region'])
  const region = useState(['app', 'selectedRegion']) || defaultRegion
  const headNode = useState([...clusterPath, 'headNode'])
  let navigate = useNavigate()
  const {t} = useTranslation()

  const apiVersion = useState(['app', 'version', 'full'])
  const clusterVersion = useState([...clusterPath, 'version'])

  const fleetStatus = useState([...clusterPath, 'computeFleetStatus'])
  const clusterStatus = useState([...clusterPath, 'clusterStatus'])
  const dcvEnabled = useState([
    ...clusterPath,
    'config',
    'HeadNode',
    'Dcv',
    'Enabled',
  ])

  function isSsmPolicy(p: any) {
    return p.hasOwnProperty('Policy') && p.Policy === ssmPolicy(region)
  }
  const iamPolicies = useState([
    ...clusterPath,
    'config',
    'HeadNode',
    'Iam',
    'AdditionalIamPolicies',
  ])
  const ssmEnabled = iamPolicies && findFirst(iamPolicies, isSsmPolicy)

  const isHeadNode =
    headNode && headNode.publicIpAddress && headNode.publicIpAddress !== ''
  const isEditDisabled =
    clusterStatus === ClusterStatus.CreateInProgress ||
    clusterStatus === ClusterStatus.DeleteInProgress ||
    clusterStatus === ClusterStatus.UpdateInProgress ||
    clusterStatus === ClusterStatus.CreateFailed ||
    clusterVersion !== apiVersion
  const isStartFleetDisabled = fleetStatus !== 'STOPPED'
  const isStopFleetDisabled = fleetStatus !== 'RUNNING'
  const isDeleteDisabled =
    !clusterName || clusterStatus === ClusterStatus.DeleteInProgress
  const isSsmDisabled =
    clusterStatus === ClusterStatus.DeleteInProgress || !ssmEnabled
  const isDcvDisabled =
    !isHeadNode ||
    clusterStatus === ClusterStatus.DeleteInProgress ||
    !dcvEnabled

  const startFleet = React.useCallback(() => {
    UpdateComputeFleet(clusterName, 'START_REQUESTED')
  }, [clusterName])

  const editConfiguration = React.useCallback(() => {
    setState(['app', 'wizard', 'clusterName'], clusterName)
    setState(['app', 'wizard', 'page'], 'cluster')
    setState(['app', 'wizard', 'editing'], true)

    navigate('/configure')
    loadTemplateFromCluster(clusterName)
  }, [clusterName, navigate])

  const deleteCluster = React.useCallback(() => {
    console.log(`Deleting: ${clusterName}`)
    DeleteCluster(clusterName, (_resp: any) => {
      navigate('/clusters')
    })
    hideDialog('deleteCluster')
  }, [clusterName, navigate])

  const shellCluster = React.useCallback(
    (instanceId: any) => {
      window.open(
        `${consoleDomain(
          region,
        )}/systems-manager/session-manager/${instanceId}?region=${region}`,
      )
    },
    [region],
  )

  const ssmFilesystem = React.useCallback(
    (instanceId: any) => {
      let user = clusterDefaultUser(cluster)
      const path = encodeURIComponent(`/home/${user}/`)
      window.open(
        `${consoleDomain(
          region,
        )}/systems-manager/managed-instances/${instanceId}/file-system?region=${region}&osplatform=Linux#%7B%22path%22%3A%22${path}%22%7D`,
      )
    },
    [cluster, region],
  )

  const dcvConnect = React.useCallback(
    (instance: any) => {
      let callback = (dcvInfo: any) => {
        window.open(
          `https://${instance.publicIpAddress}:${dcvInfo.port}?authToken=${dcvInfo.session_token}#${dcvInfo.session_id}`,
        )
      }
      let user = clusterDefaultUser(cluster)
      GetDcvSession(instance.instanceId, user, callback)
    },
    [cluster],
  )

  const openFileSystem = React.useCallback(() => {
    ssmFilesystem(headNode.instanceId)
  }, [headNode?.instanceId, ssmFilesystem])

  const onShellClick = React.useCallback(() => {
    shellCluster(headNode.instanceId)
  }, [headNode?.instanceId, shellCluster])

  const onDcvClick = React.useCallback(() => {
    dcvConnect(headNode)
  }, [dcvConnect, headNode])

  const onItemClick: CancelableEventHandler<ButtonDropdownProps.ItemClickDetails> =
    React.useCallback(
      item => {
        switch (item.detail.id) {
          case 'filesystem':
            openFileSystem()
            break
          case 'edit':
            editConfiguration()
            break
          case 'logs':
            navigate(`/clusters/${clusterName}/logs`)
            break
          case 'delete':
            showDialog('deleteCluster')
            break
        }
      },
      [openFileSystem, editConfiguration, navigate, clusterName],
    )

  const clusterActionsGroupButtonItems: ButtonDropdownProps.ItemOrGroup[] =
    React.useMemo(() => {
      return [
        {
          id: 'logs',
          text: t('cluster.list.actions.logs'),
        },
        {
          id: 'filesystem',
          text: t('cluster.list.actions.filesystem'),
          disabled: isSsmDisabled,
          external: true,
          href: '#',
        },
        {
          id: 'edit',
          text: t('cluster.list.actions.edit'),
          disabled: isEditDisabled,
        },
        {
          id: 'delete',
          text: t('cluster.list.actions.delete'),
          disabled: isDeleteDisabled,
        },
      ]
    }, [t, isSsmDisabled, isEditDisabled, isDeleteDisabled])

  const isActionsDisabled = isSsmDisabled && isEditDisabled && isDeleteDisabled

  return (
    <>
      <DeleteDialog
        id="deleteCluster"
        header={t('cluster.list.dialogs.delete.title')}
        deleteCallback={deleteCluster}
      >
        {t('cluster.list.dialogs.delete.body', {clusterName: clusterName})}
      </DeleteDialog>
      <StopDialog clusterName={clusterName} />
      <SpaceBetween direction="horizontal" size="xs">
        <Button
          disabled={isSsmDisabled}
          onClick={onShellClick}
          iconName="external"
        >
          {t('cluster.list.actions.shell')}
        </Button>
        <Button
          disabled={isDcvDisabled}
          onClick={onDcvClick}
          iconName="external"
        >
          {t('cluster.list.actions.dcv')}
        </Button>

        {isStartFleetDisabled ? (
          <Button
            variant="normal"
            onClick={stopComputeFleet}
            disabled={isStopFleetDisabled}
          >
            {t('cluster.list.actions.stop')}
          </Button>
        ) : (
          <Button
            variant="normal"
            onClick={startFleet}
            disabled={isStartFleetDisabled}
          >
            {t('cluster.list.actions.start')}
          </Button>
        )}

        <ButtonDropdown
          onItemClick={onItemClick}
          items={clusterActionsGroupButtonItems}
          disabled={isActionsDisabled}
        >
          {t('cluster.list.actionsLabel')}
        </ButtonDropdown>

        <CreateButtonDropdown openWizard={wizardShow} />
      </SpaceBetween>
    </>
  )
}
