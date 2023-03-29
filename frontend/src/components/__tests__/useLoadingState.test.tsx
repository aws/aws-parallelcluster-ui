import {renderHook} from '@testing-library/react-hooks'
import {useLoadingState} from '../useLoadingState'
import {Box} from '@cloudscape-design/components'
import React from 'react'
import DoneCallback = jest.DoneCallback
import {AxiosError} from 'axios'
import {Provider} from 'react-redux'
import {mock} from 'jest-mock-extended'
import {Store} from '@reduxjs/toolkit'

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

const mockGetAppConfig = jest.fn()
const mockGetIdentity = jest.fn()

jest.mock('../../model', () => {
  return {
    GetAppConfig: () => mockGetAppConfig(),
    GetIdentity: () => mockGetIdentity(),
  }
})

const mockStore = mock<Store>()
const wrapper = (props: any) => (
  <Provider store={mockStore}>{props.children}</Provider>
)

describe('given a hook to load all the data necessary for the app to boot', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('when the necessary data is already available', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        identity: {
          someKey: 'some-value',
        },
        app: {
          appConfig: {
            someKey: 'some-value',
          },
        },
      })
    })

    it('should set loading to false', () => {
      const {result} = renderHook(() => useLoadingState(<></>), {wrapper})

      expect(result.current.loading).toBe(false)
    })

    it('should return the wrapped component as is', () => {
      const mockContent = <div />
      const {result} = renderHook(() => useLoadingState(mockContent), {wrapper})

      expect(result.current.content).toBe(mockContent)
    })

    it('should not request the data', () => {
      renderHook(() => useLoadingState(<Box></Box>), {wrapper})

      expect(mockGetAppConfig).toHaveBeenCalledTimes(0)
      expect(mockGetIdentity).toHaveBeenCalledTimes(0)
    })
  })

  describe('when the identity is not available', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        identity: null,
        app: {
          appConfig: {
            someKey: 'some-value',
          },
        },
      })
    })

    it('should request the data', async () => {
      const {waitForNextUpdate} = renderHook(
        () => useLoadingState(<Box></Box>),
        {wrapper},
      )

      await waitForNextUpdate()

      expect(mockGetAppConfig).toHaveBeenCalledTimes(1)
      expect(mockGetIdentity).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the app config is not available', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        identity: {
          someKey: 'some-value',
        },
        app: {
          appConfig: null,
        },
      })
    })

    it('should request the data', async () => {
      const {waitForNextUpdate} = renderHook(
        () => useLoadingState(<Box></Box>),
        {wrapper},
      )

      await waitForNextUpdate()

      expect(mockGetAppConfig).toHaveBeenCalledTimes(1)
      expect(mockGetIdentity).toHaveBeenCalledTimes(1)
    })
  })

  describe('when some data is not available', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        identity: null,
        app: null,
      })
    })

    describe('when the data is being fetched', () => {
      beforeEach(() => {
        const neverResolve = new Promise(() => null)
        mockGetAppConfig.mockReturnValue(neverResolve)
      })

      it('should set loading to true', async () => {
        const {result} = renderHook(() => useLoadingState(<></>), {wrapper})

        expect(result.current.loading).toBe(true)
      })

      it('should return some loading component', () => {
        const mockContent = <div />
        const {result} = renderHook(() => useLoadingState(mockContent), {
          wrapper,
        })

        expect(result.current.content).not.toBe(mockContent)
      })
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
        mockGetIdentity.mockImplementation(() => Promise.reject(axiosError)),
      )

      it('should not re-throw the error', async () => {
        const unhandledRejectionHandler = () =>
          fail('it should not have rethrown the error')

        _process.on('unhandledRejection', unhandledRejectionHandler)

        renderHook(() => useLoadingState(<></>), {wrapper})
      })
    })

    describe('when the encountered error is NOT due to a authn/z', () => {
      const axiosError = {
        response: {
          status: 500,
        },
      } as AxiosError

      beforeEach(() =>
        mockGetIdentity.mockImplementation(() => Promise.reject(axiosError)),
      )

      it('should re-throw the error', (done: DoneCallback) => {
        _process.on('unhandledRejection', (error: any) => {
          expect(error).toBe(axiosError)
          done()
        })

        const {waitForNextUpdate} = renderHook(() => useLoadingState(<></>), {
          wrapper,
        })
        waitForNextUpdate()
      })
    })
  })
})
