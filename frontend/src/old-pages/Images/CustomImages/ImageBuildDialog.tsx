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
import {BuildImage} from '../../../model'

// UI Elements
import {
  Box,
  Button,
  Flashbar,
  FlashbarProps,
  FormField,
  Header,
  Input,
  Modal,
  Select,
  SpaceBetween,
} from '@cloudscape-design/components'

import FileUploadButton from '../../../components/FileChooser'

// State
import {setState, useState, getState, clearState} from '../../../store'
import ConfigView from '../../../components/ConfigView'
import {useTranslation} from 'react-i18next'
import {AxiosError} from 'axios'
import {errorsToFlashbarItems} from '../../Configure/errorsToFlashbarItems'

const buildImageErrorsPath = ['app', 'buildImage', 'errors']

// Constants
const imageBuildPath = ['app', 'customImages', 'imageBuild']

function buildImageValidate(errorMessage: string) {
  let valid = true
  const imageId = getState([...imageBuildPath, 'imageId'])

  setState([...buildImageErrorsPath, 'validated'], true)

  if (!imageId || imageId === '') {
    setState([...buildImageErrorsPath, 'imageId'], errorMessage)
    valid = false
  } else {
    clearState([...buildImageErrorsPath, 'imageId'])
  }

  return valid
}

export default function ImageBuildDialog() {
  const {t} = useTranslation()
  const open = useState([...imageBuildPath, 'dialog'])
  const imageConfig = useState([...imageBuildPath, 'config']) || ''
  const errors = useState([...imageBuildPath, 'errors'])
  const imageId = useState([...imageBuildPath, 'imageId'])
  const pending = useState([...imageBuildPath, 'pending'])
  const versions = useState(['app', 'version', 'full'])
  const [selectedVersion, setSelectedVersion] = React.useState(versions[0])

  let validated = useState([...buildImageErrorsPath, 'validated'])

  let imageIdError = useState([...buildImageErrorsPath, 'imageId'])
  const missingImageIdError = t('customImages.dialogs.buildImage.imageIdError')

  React.useEffect(() => {
    setFlashbarItems(errorsToFlashbarItems(errors, setFlashbarItems))
  }, [errors])

  const [flashbarItems, setFlashbarItems] = React.useState<
    FlashbarProps.MessageDefinition[]
  >([])

  const handleClose = () => {
    setState([...imageBuildPath, 'dialog'], false)
    clearState([...imageBuildPath, 'errors'])
  }

  const handleBuild = async () => {
    clearState([...imageBuildPath, 'errors'])
    setState([...imageBuildPath, 'pending'], true)
    if (buildImageValidate(missingImageIdError)) {
      try {
        await BuildImage(imageId, imageConfig, selectedVersion)
        handleClose()
      } catch (error: unknown) {
        if ((error as AxiosError).response) {
          setState(
            [...imageBuildPath, 'errors'],
            (error as AxiosError).response?.data,
          )
        }
      }
      setState([...imageBuildPath, 'pending'], false)
    }
  }

  const setImageId = (newImageId: any) => {
    if (newImageId !== imageId) {
      setState([...imageBuildPath, 'imageId'], newImageId)
      if (validated) buildImageValidate(missingImageIdError)
    }
  }

  const descriptionElementRef = React.useRef(null)
  React.useEffect(() => {
    if (open) {
      const {current: descriptionElement} = descriptionElementRef
      if (descriptionElement !== null) {
        ;(descriptionElement as any).focus()
      }
    }
  }, [open])

  return (
    <Modal
      visible={open || false}
      onDismiss={handleClose}
      closeAriaLabel={t('customImages.dialogs.buildImage.closeAriaLabel')}
      size="large"
      header={
        <Header
          variant="h2"
          actions={
            <FileUploadButton
              className="upload"
              handleData={(data: any) => {
                setState([...imageBuildPath, 'config'], data)
              }}
            />
          }
        >
          {t('customImages.dialogs.buildImage.title')}
        </Header>
      }
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={handleClose}>
              {t('customImages.dialogs.buildImage.cancel')}
            </Button>
            <Button
              disabled={pending}
              loading={pending}
              variant="primary"
              onClick={() => {
                buildImageValidate(missingImageIdError) && handleBuild()
              }}
            >
              {t('customImages.dialogs.buildImage.build')}
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween direction="vertical" size="xs">
        <FormField
          errorText={imageIdError}
          label={t('customImages.dialogs.buildImage.imageIdLabel')}
        >
          <Input
            value={imageId}
            placeholder={t(
              'customImages.dialogs.buildImage.imageIdPlaceholder',
            )}
            onChange={({detail}) => {
              setImageId(detail.value)
            }}
          />
        </FormField>
        <Flashbar items={flashbarItems} />
        <SpaceBetween direction="vertical" size="xs">
          <FormField
              label={t('customImages.dialogs.buildImage.versionLabel')}
          >
            <Select
                selectedOption={{ label: selectedVersion, value: selectedVersion }}
                onChange={({ detail }) => setSelectedVersion(detail.selectedOption.value)}
                options={versions.map((version: any) => ({ label: version, value: version }))}
                placeholder={t('customImages.dialogs.buildImage.versionPlaceholder')}
            />
          </FormField>
          <ConfigView
              config={imageConfig}
              onChange={({detail}: any) => {
                setState([...imageBuildPath, 'config'], detail.value)
              }}
          />
        </SpaceBetween>
      </SpaceBetween>
    </Modal>
  )
}
