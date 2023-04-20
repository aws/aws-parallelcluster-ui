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
import React, {useCallback, useEffect} from 'react'
import {useSelector} from 'react-redux'
import {useCollection} from '@cloudscape-design/collection-hooks'
import {clearState, setState, useState} from '../../store'

import {DeleteUser, ListUsers} from '../../model'

// UI Elements
import {
  Button,
  Header,
  Pagination,
  SpaceBetween,
  Table,
  TextFilter,
} from '@cloudscape-design/components'

// Components
import EmptyState from '../../components/EmptyState'
import DateView from '../../components/date/DateView'
import {
  DeleteDialog,
  showDialog,
  hideDialog,
} from '../../components/DeleteDialog'
import Layout from '../Layout'
import {useHelpPanel} from '../../components/help-panel/HelpPanel'
import {User} from '../../types/users'
import {Trans, useTranslation} from 'react-i18next'
import TitleDescriptionHelpPanel from '../../components/help-panel/TitleDescriptionHelpPanel'
import InfoLink from '../../components/InfoLink'
import {extendCollectionsOptions} from '../../shared/extendCollectionsOptions'
import AddUserModal from './AddUserModal'

const selectUserIndex = (state: any) => state.users.index

function UsersHelpPanel() {
  const {t} = useTranslation()
  return (
    <TitleDescriptionHelpPanel
      title={t('users.helpPanel.title')}
      description={<Trans i18nKey="users.helpPanel.description" />}
    />
  )
}

const usersSlug = 'users'
export default function Users() {
  const {t} = useTranslation()
  const loading = !useSelector(selectUserIndex)
  const user_index = useSelector(selectUserIndex) || {}
  const usernames = Object.keys(user_index).sort()
  const users = usernames
    .map(username => user_index[username])
    .map(user => ({
      ...user,
      email: user.Attributes.email, // adds the email as first-level property so that Cloudscape can filter properly
    }))

  const userEmail = useState(['app', 'user', 'delete', 'Attributes', 'email'])
  const deletedUser = useState(['app', 'user', 'delete'])
  const [selectedUsers, setSelectedUsers] = React.useState<User[]>([])
  const currentUserEmail = useState(['identity', 'attributes', 'email'])
  const [addUserModalVisible, setAddUserModalVisible] = React.useState(false)

  useHelpPanel(<UsersHelpPanel />)

  useEffect(() => {
    ListUsers()
  }, [])

  const refreshUsers = useCallback(() => {
    ListUsers()
  }, [])

  const {
    items,
    actions,
    filteredItemsCount,
    collectionProps,
    filterProps,
    paginationProps,
  } = useCollection(
    users || [],
    extendCollectionsOptions({
      filtering: {
        empty: (
          <EmptyState
            title={t('users.list.filtering.empty.title')}
            subtitle={t('users.list.filtering.empty.subtitle')}
            action={<></>}
          />
        ),
        noMatch: (
          <EmptyState
            title={t('users.list.filtering.noMatch.title')}
            subtitle={t('users.list.filtering.noMatch.subtitle')}
            action={
              <Button onClick={() => actions.setFiltering('')}>
                {t('users.list.filtering.noMatch.action')}
              </Button>
            }
          />
        ),
      },
      sorting: {
        defaultState: {
          sortingColumn: {
            sortingField: 'email',
          },
        },
      },
      selection: {},
    }),
  )

  const deleteUser = useCallback(() => {
    DeleteUser(deletedUser, (returned_user: any) => {
      clearState(['users', 'index', returned_user.Username])
      setSelectedUsers([])
    })
    hideDialog('deleteUser')
  }, [deletedUser])

  const isDeleteUserButtonDisabled = () => {
    return (
      selectedUsers.length === 0 ||
      currentUserEmail === selectedUsers[0].Attributes.email
    )
  }

  const onSelectionChangeCallback = useCallback(({detail}) => {
    setSelectedUsers(detail.selectedItems)
  }, [])

  return (
    <Layout pageSlug={usersSlug}>
      <DeleteDialog
        id="deleteUser"
        header={t('users.list.dialogs.delete.title')}
        deleteCallback={deleteUser}
      >
        {t('users.list.dialogs.delete.body', {userEmail})}
      </DeleteDialog>
      <AddUserModal
        visible={addUserModalVisible}
        setVisible={setAddUserModalVisible}
      />
      <Table
        {...collectionProps}
        resizableColumns
        trackBy={item => item.email}
        variant="full-page"
        selectionType="single"
        stickyHeader
        header={
          <Header
            variant="awsui-h1-sticky"
            counter={users && `(${Object.keys(users).length})`}
            description={t('users.header.description')}
            info={<InfoLink helpPanel={<UsersHelpPanel />} />}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={refreshUsers}>
                  {t('users.actions.refresh')}
                </Button>
                <Button
                  disabled={isDeleteUserButtonDisabled()}
                  onClick={() => {
                    setState(['app', 'user', 'delete'], selectedUsers[0])
                    showDialog('deleteUser')
                  }}
                >
                  {t('users.actions.remove')}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setAddUserModalVisible(true)}
                >
                  {t('users.actions.add')}
                </Button>
              </SpaceBetween>
            }
          >
            {t('users.header.title')}
          </Header>
        }
        columnDefinitions={[
          {
            id: 'email',
            header: t('users.list.columns.email'),
            cell: item => item.email || '-',
            sortingField: 'email',
          },
          {
            id: 'created',
            header: t('users.list.columns.created'),
            cell: item => <DateView date={item.UserCreateDate} />,
            sortingField: 'UserCreateDate',
          },
        ]}
        loading={loading}
        items={items}
        loadingText={t('users.list.filtering.loadingText')}
        pagination={<Pagination {...paginationProps} />}
        onSelectionChange={onSelectionChangeCallback}
        selectedItems={selectedUsers}
        filter={
          <TextFilter
            {...filterProps}
            countText={t('users.list.filtering.countText', {
              filteredItemsCount,
            })}
            filteringAriaLabel={t('users.list.filtering.filteringAriaLabel')}
            filteringPlaceholder={t(
              'users.list.filtering.filteringPlaceholder',
            )}
          />
        }
      />
    </Layout>
  )
}
