import {Box, SpaceBetween, Spinner} from '@cloudscape-design/components'
import React from 'react'
import {GetAppConfig, GetIdentity} from '../model'

export function LoadingSpinnerContent() {
  return (
    <SpaceBetween direction="vertical" size="l">
      <Box textAlign="center">
        <Spinner size="large"></Spinner>
      </Box>
    </SpaceBetween>
  )
}
interface UseLoadingStateResponse {
  loading: boolean
  content: React.ReactNode
}
export function useLoadingState(
  wrappedComponents: any,
): UseLoadingStateResponse {
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const getPreliminaryInfo = async () => {
      setLoading(true)
      await GetAppConfig()

      try {
        await GetIdentity(undefined, true)
      } catch (error: any) {
        const status = error?.response?.status
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
