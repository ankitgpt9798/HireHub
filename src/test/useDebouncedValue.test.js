import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDebouncedValue } from '../hooks/useDebouncedValue.js'

function renderDebounced(value) {
  return renderHook((props) => useDebouncedValue(props.value, 300), {
    initialProps: { value },
  })
}

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the initial value right away', () => {
    const { result } = renderDebounced('a')
    expect(result.current).toBe('a')
  })

  it('updates once the value has stopped changing for the delay', () => {
    const { result, rerender } = renderDebounced('a')

    rerender({ value: 'ab' })
    act(() => vi.advanceTimersByTime(299))
    expect(result.current).toBe('a')

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe('ab')
  })

  it('restarts the delay whenever the value changes', () => {
    const { result, rerender } = renderDebounced('a')

    rerender({ value: 'ab' })
    act(() => vi.advanceTimersByTime(200))
    rerender({ value: 'abc' })
    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe('a')

    act(() => vi.advanceTimersByTime(100))
    expect(result.current).toBe('abc')
  })

  it('cancels a pending update when unmounted', () => {
    const { rerender, unmount } = renderDebounced('a')

    rerender({ value: 'ab' })
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
