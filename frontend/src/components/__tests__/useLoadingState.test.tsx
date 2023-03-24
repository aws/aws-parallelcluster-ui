import {renderHook} from '@testing-library/react-hooks'

jest.mock('../../model', () => {
  return {
    GetAppConfig: jest.fn(),
    GetIdentity: jest.fn(),
  }
})

import {GetIdentity, GetAppConfig} from '../../model'
import {useLoadingState} from '../useLoadingState'
import {Box} from '@cloudscape-design/components'
import React from 'react'
import {Mock} from 'jest-mock'

describe('given a prerequisite to allow a component to be displayed', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('when the prerequisites are met', () => {
    it('should render the component', async () => {
      const box = <Box></Box>
      const {result, waitForNextUpdate} = renderHook(() => useLoadingState(box))

      await waitForNextUpdate()

      expect(result.current.loading).toBe(false)
      expect(result.current.content).toEqual(box)
    })

    it('should invoke the necessary functions', async () => {
      const {waitForNextUpdate} = renderHook(() => useLoadingState(<Box></Box>))

      await waitForNextUpdate()

      expect(GetAppConfig).toHaveBeenCalledTimes(1)
      expect(GetIdentity).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the prerequisites are being checked', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      ;(GetIdentity as Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 10000)),
      )
      ;(GetAppConfig as Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 10000)),
      )
    })

    afterEach(() => jest.useRealTimers())

    it('should render a loading component', () => {
      const {result} = renderHook(() => useLoadingState(<Box></Box>))

      jest.advanceTimersByTime(1000)

      expect(result.current.loading).toBe(true)
    })
  })
})
