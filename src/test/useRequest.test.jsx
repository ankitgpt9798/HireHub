import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useJobs } from '../hooks/useJobs.js'
import { useRequest } from '../hooks/useRequest.js'

// A promise that the test settles by hand, to control when and in which order answers arrive.
function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

// A `load` function whose calls each get their own deferred answer, recorded with the signal
// they were given.
function controlledLoad() {
  const calls = []
  const load = vi.fn((signal, key) => {
    const call = { signal, key, ...deferred() }
    calls.push(call)
    return call.promise
  })
  return { load, calls }
}

function renderRequest(load, key = 'jobs') {
  return renderHook(({ requestKey }) => useRequest(requestKey, (signal) => load(signal, requestKey)), {
    initialProps: { requestKey: key },
  })
}

describe('useRequest', () => {
  it('loads on mount and reports the answer', async () => {
    const { load, calls } = controlledLoad()
    const { result } = renderRequest(load)

    expect(result.current).toMatchObject({ status: 'loading', data: undefined, error: null })
    expect(load).toHaveBeenCalledOnce()

    await act(async () => calls[0].resolve(['a job']))

    expect(result.current).toMatchObject({ status: 'success', data: ['a job'], error: null })
  })

  it('reports a failure and loads again on retry', async () => {
    const { load, calls } = controlledLoad()
    const { result } = renderRequest(load)
    const failure = new Error('No answer')

    await act(async () => calls[0].reject(failure))
    expect(result.current).toMatchObject({ status: 'error', data: undefined, error: failure })

    act(() => result.current.retry())
    expect(result.current).toMatchObject({ status: 'loading', error: null })
    expect(load).toHaveBeenCalledTimes(2)

    await act(async () => calls[1].resolve(['a job']))
    expect(result.current).toMatchObject({ status: 'success', data: ['a job'] })
  })

  it('keeps the previous answer while loading again and after a failed retry', async () => {
    const { load, calls } = controlledLoad()
    const { result } = renderRequest(load)
    await act(async () => calls[0].resolve(['first']))

    act(() => result.current.retry())
    expect(result.current).toMatchObject({ status: 'loading', data: ['first'] })

    await act(async () => calls[1].reject(new Error('No answer')))
    expect(result.current).toMatchObject({ status: 'error', data: ['first'] })
  })

  it('keeps the same retry function between renders', async () => {
    const { load, calls } = controlledLoad()
    const { result } = renderRequest(load)
    const { retry } = result.current

    await act(async () => calls[0].resolve([]))
    expect(result.current.retry).toBe(retry)
  })

  it('starts over for a new key and ignores the answer for the old one', async () => {
    const { load, calls } = controlledLoad()
    const { result, rerender } = renderRequest(load, 'job-001')
    await act(async () => calls[0].resolve('details of job-001'))

    rerender({ requestKey: 'job-002' })
    expect(result.current).toMatchObject({ status: 'loading', data: undefined })
    expect(calls[1].key).toBe('job-002')

    rerender({ requestKey: 'job-003' })
    expect(calls[1].signal.aborted).toBe(true)

    // The answer for job-002 arrives after the one for job-003 and must not replace it.
    await act(async () => calls[2].resolve('details of job-003'))
    await act(async () => calls[1].resolve('details of job-002'))

    expect(result.current).toMatchObject({ status: 'success', data: 'details of job-003' })
  })

  it('ignores a late answer to a request replaced by a retry', async () => {
    const { load, calls } = controlledLoad()
    const { result } = renderRequest(load)

    act(() => result.current.retry())
    expect(calls[0].signal.aborted).toBe(true)

    await act(async () => calls[1].resolve('new answer'))
    await act(async () => calls[0].reject(new Error('Old failure')))

    expect(result.current).toMatchObject({ status: 'success', data: 'new answer', error: null })
  })

  it('aborts the request when the component unmounts', async () => {
    const { load, calls } = controlledLoad()
    const { unmount } = renderRequest(load)

    unmount()
    expect(calls[0].signal.aborted).toBe(true)

    // A late answer is ignored rather than updating an unmounted component.
    await act(async () => calls[0].resolve('too late'))
  })
})

describe('useJobs', () => {
  it('explains that it needs a JobsProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useJobs())).toThrow('useJobs must be used inside a JobsProvider.')
    vi.restoreAllMocks()
  })
})
