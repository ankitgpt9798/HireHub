import { useCallback, useEffect, useEffectEvent, useState } from 'react'

const LOADING = { status: 'loading', data: undefined, error: null }

// Tracks an asynchronous request, such as a call to the job service. `load(signal)` returns a
// promise, and `signal` aborts once its answer is no longer wanted. The request runs when the
// component mounts, again whenever `key` changes, and on `retry()`.
//
// Returns `{ status, data, error, retry }`:
// - `status`: 'loading', 'success', or 'error'.
// - `data`: the latest answer for this key. It stays while the request runs again or fails, so
//   a list can stay on screen while it refreshes, and is cleared when `key` changes.
// - `error`: why the latest request failed, or null.
//
// Only the latest request counts. A new key, a retry, or unmounting aborts the request before
// it, and that request's answer is ignored even if it arrives later.
export function useRequest(key, load) {
  const [request, setRequest] = useState({ key, attempt: 0 })
  const [result, setResult] = useState(LOADING)

  if (request.key !== key) {
    setRequest({ key, attempt: 0 })
    setResult(LOADING)
  }

  const startLoad = useEffectEvent(load)
  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    startLoad(signal).then(
      (data) => {
        if (!signal.aborted) setResult({ status: 'success', data, error: null })
      },
      (error) => {
        if (!signal.aborted) setResult((current) => ({ status: 'error', data: current.data, error }))
      },
    )
    return () => controller.abort()
  }, [request])

  const retry = useCallback(() => {
    setRequest((current) => ({ ...current, attempt: current.attempt + 1 }))
    setResult((current) => ({ ...current, status: 'loading', error: null }))
  }, [])

  return { ...result, retry }
}
