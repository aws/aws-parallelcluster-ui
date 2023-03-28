import {Box, SpaceBetween, Spinner} from '@cloudscape-design/components'
import React from 'react'
import {GetAppConfig, GetIdentity} from '../model'
import {AxiosError} from 'axios'
import {BoxProps} from '@cloudscape-design/components/box/interfaces'

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
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const getPreliminaryInfo = async () => {
      setLoading(true)
      await GetAppConfig()

      try {
        await GetIdentity()
      } catch (error: any) {
        const status = (error as AxiosError)?.response?.status
        if (status != 403 && status != 401) {
          throw error // rethrow in case error is not authn/z related
        }
      }
      setLoading(false)
    }

    getPreliminaryInfo()
  }, [])

  return {
    loading,
    content: loading ? <LoadingSpinnerContent /> : wrappedComponents,
  }
}

export {useLoadingState, LoadingSpinnerContent}
