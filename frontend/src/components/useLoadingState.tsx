import {Box, Spinner} from '@cloudscape-design/components'
import React from 'react'
import {GetAppConfig, GetIdentity, GetVersion} from '../model'
import {AxiosError} from 'axios'
import {BoxProps} from '@cloudscape-design/components/box/interfaces'
import {useState} from '../store'
import {AppConfig} from '../app-config/types'
import {UserIdentity} from '../auth/types'
import {PCVersion} from '../types/base'

const loadingSpinnerMargin: BoxProps.Spacing = {top: 'xxxl'}

function LoadingSpinnerContent() {
  return (
    <Box textAlign="center" margin={loadingSpinnerMargin}>
      <Spinner size="large"></Spinner>
    </Box>
  )
}
interface UseLoadingStateResponse {
  loading: boolean
  content: React.ReactNode
}
function useLoadingState(
  wrappedComponents: React.ReactNode,
): UseLoadingStateResponse {
  const identity: UserIdentity | null = useState(['identity'])
  const appConfig: AppConfig | null = useState(['app', 'appConfig'])
  const version: PCVersion | null = useState(['app', 'version', 'full'])

  const shouldLoadData = !identity || !appConfig || !version

  const [loading, setLoading] = React.useState(shouldLoadData)

  React.useEffect(() => {
    const getPreliminaryInfo = async () => {
      setLoading(true)
      await Promise.all([GetAppConfig(), GetVersion()])

      try {
        await GetIdentity()
        setLoading(false)
      } catch (error: any) {
        const status = (error as AxiosError)?.response?.status
        if (status != 403 && status != 401) {
          setLoading(false)
          throw error // rethrow in case error is not authn/z related
        }
      }
    }

    if (shouldLoadData) {
      getPreliminaryInfo()
    }
  }, [shouldLoadData])

  return {
    loading,
    content: loading ? <LoadingSpinnerContent /> : wrappedComponents,
  }
}

export {useLoadingState, LoadingSpinnerContent}
