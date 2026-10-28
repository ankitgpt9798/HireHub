import { useEffect, useState } from 'react'

// Returns `value` once it has stopped changing for `delayMs`, so work that depends on it
// (such as updating search results) waits until the user pauses instead of running per keystroke.
export function useDebouncedValue(value, delayMs) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delayMs)
    return () => clearTimeout(timeoutId)
  }, [value, delayMs])

  return debouncedValue
}
