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

// @ts-expect-error TS(7016) FIXME: Could not find a declaration file for module 'js-y... Remove this comment to see the full error message
import jsyaml from 'js-yaml'

import {setState, useState, ssmPolicy, consoleDomain} from '../../store'
import {
  UpdateComputeFleet,
  GetConfiguration,
  GetDcvSession,
  DeleteCluster,
} from '../../model'
import {findFirst, clusterDefaultUser} from '../../util'
import {loadTemplate} from '../Configure/util'
import {useTranslation} from 'react-i18next'

import Button from '@cloudscape-design/components/button'
import SpaceBetween from '@cloudscape-design/components/space-between'

import {
  DeleteDialog,
  showDialog,
  hideDialog,
} from '../../components/DeleteDialog'
import {StopDialog, stopComputeFleet} from './StopDialog'
import {wizardShow} from '../Configure/Configure'
import {ButtonDropdown} from '@cloudscape-design/components'
import {CancelableEventHandler} from '@cloudscape-design/components/internal/events'
import {ButtonDropdownProps} from '@cloudscape-design/components/button-dropdown/interfaces'

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
    !isHeadNode ||
    clusterStatus === ClusterStatus.DeleteInProgress ||
    !ssmEnabled
  const isDcvDisabled =
    !isHeadNode ||
    clusterStatus === ClusterStatus.DeleteInProgress ||
    !dcvEnabled

  const configure = React.useCallback(() => {
    wizardShow(navigate)
  }, [navigate])

  const startFleet = React.useCallback(() => {
    UpdateComputeFleet(clusterName, 'START_REQUESTED')
  }, [clusterName])

  const editConfiguration = React.useCallback(() => {
    setState(['app', 'wizard', 'clusterName'], clusterName)
    setState(['app', 'wizard', 'page'], 'cluster')
    setState(['app', 'wizard', 'editing'], true)

    navigate('/configure')

    GetConfiguration(clusterName, (configuration: any) => {
      loadTemplate(jsyaml.load(configuration))
    })
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

  const onFileSystemClick = React.useCallback(() => {
    ssmFilesystem(headNode.instanceId)
  }, [headNode?.instanceId, ssmFilesystem])

  const onShellClick = React.useCallback(() => {
    shellCluster(headNode.instanceId)
  }, [headNode?.instanceId, shellCluster])

  const onDcvClick = React.useCallback(() => {
    dcvConnect(headNode)
  }, [dcvConnect, headNode])

  const onItemClick: CancelableEventHandler<ButtonDropdownProps.ItemClickDetails> =
    React.useMemo(() => {
      return item => {
        switch (item.detail.id) {
          case 'filesystem':
            return onFileSystemClick
          case 'edit':
            return editConfiguration
          case 'delete':
            return () => showDialog('deleteCluster')
        }
      }
    }, [onFileSystemClick, editConfiguration])

  return (
    <div style={{marginLeft: '20px'}}>
      <DeleteDialog
        id="deleteCluster"
        header={t('cluster.list.dialogs.delete.title')}
        deleteCallback={deleteCluster}
      >
        {t('cluster.list.dialogs.delete.body', {clusterName: clusterName})}
      </DeleteDialog>
      <StopDialog clusterName={clusterName} />
      <SpaceBetween direction="horizontal" size="xs">
        <Button disabled={isSsmDisabled} onClick={onShellClick}>
          {t('cluster.list.actions.shell')}
        </Button>
        <Button disabled={isDcvDisabled} onClick={onDcvClick}>
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
          items={[
            {
              id: 'filesystem',
              text: t('cluster.list.actions.filesystem'),
              disabled: isSsmDisabled,
            },
            {
              id: 'edit',
              text: t('cluster.list.actions.edit'),
              disabled: isEditDisabled,
            },
            {
              id: 'edit',
              text: t('cluster.list.actions.delete'),
              disabled: isDeleteDisabled,
            },
          ]}
        >
          {t('cluster.list.actionsLabel')}
        </ButtonDropdown>

        <Button onClick={configure} variant="primary">
          {t('cluster.list.actions.create')}
        </Button>
      </SpaceBetween>
    </div>
  )
}
