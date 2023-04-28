import {useFeatureFlag} from '../../feature-flags/useFeatureFlag'

export function useCostMonitoringFeature() {
  const isCostMonitoringActive = useFeatureFlag('cost_monitoring')
  const isExperimentalActive = useFeatureFlag('experimental')

  return isCostMonitoringActive && isExperimentalActive
}
