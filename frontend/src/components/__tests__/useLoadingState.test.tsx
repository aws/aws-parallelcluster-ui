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
import DoneCallback = jest.DoneCallback
import {AxiosError} from 'axios'

// @ts-ignore
const _process = process._original()

function storeOriginalJestListeners(originalJestListeners: {
  unhandledRejection: any[]
}) {
  _process.listeners('unhandledRejection').forEach((listener: any) => {
    originalJestListeners['unhandledRejection'].push(listener)
    _process.off('unhandledRejection', listener)
  })
}

function restoreOriginalJestListeners(originalJestListeners: {
  unhandledRejection: any[]
}) {
  let listener
  while (
    (listener = originalJestListeners['unhandledRejection'].pop()) !== undefined
  ) {
    _process.on('unhandledRejection', listener)
  }
}

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

  describe('when the prerequisites are not met', () => {
    const originalJestListeners = {
      unhandledRejection: [] as any[],
    }

    beforeEach(() => {
      storeOriginalJestListeners(originalJestListeners)
    })

    afterEach(() => {
      restoreOriginalJestListeners(originalJestListeners)
    })

    describe('when the encountered error is due to a authn/z', () => {
      const axiosError = {
        response: {
          status: 401,
        },
      } as AxiosError

      beforeEach(() =>
        (GetIdentity as Mock).mockImplementation(() =>
          Promise.reject(axiosError),
        ),
      )

      it('should not re-throw the error', async () => {
        const unhandledRejectionHandler = () =>
          fail('it should not have rethrown the error')

        _process.on('unhandledRejection', unhandledRejectionHandler)

        const {waitForNextUpdate} = renderHook(() => useLoadingState(<></>))

        await waitForNextUpdate()
      })
    })

    describe('when the encountered error is NOT due to a authn/z', () => {
      const axiosError = {
        response: {
          status: 500,
        },
      } as AxiosError

      beforeEach(() =>
        (GetIdentity as Mock).mockImplementation(() =>
          Promise.reject(axiosError),
        ),
      )

      it('should re-throw the error', (done: DoneCallback) => {
        _process.on('unhandledRejection', (error: any) => {
          expect(error).toBe(axiosError)
          done()
        })

        renderHook(() => useLoadingState(<></>))
      })
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
