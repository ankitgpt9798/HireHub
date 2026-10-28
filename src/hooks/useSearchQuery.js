import { useEffect, useEffectEvent, useState } from 'react'
import { useNavigationType, useSearchParams } from 'react-router'
import { useDebouncedValue } from './useDebouncedValue.js'

export const SEARCH_PARAM = 'q'
export const SEARCH_DEBOUNCE_MS = 300

// State for a search box whose query lives in the URL (`?q=`), so a search survives a reload
// or a trip to a job's details page and back.
//
// - `input` is the box's text. It changes on every keystroke.
// - `query` is the search the results should use, read from the URL. It follows `input` once
//   typing pauses for SEARCH_DEBOUNCE_MS, or straight away through `applyInput`.
//
// The box keeps its own state rather than reading the URL because React Router renders
// navigations in a transition, and a text input updated in a transition can drop keystrokes.
export function useSearchQuery() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = (searchParams.get(SEARCH_PARAM) ?? '').trim()
  const navigationType = useNavigationType()

  const [input, setInput] = useState(query)
  const [syncedQuery, setSyncedQuery] = useState(query)

  // The URL's query changed. This hook replaces the history entry when it writes the query,
  // and the box already shows that text. A link or back/forward navigation pushes or pops
  // instead, so show its query in the box.
  if (query !== syncedQuery) {
    setSyncedQuery(query)
    if (navigationType !== 'REPLACE') setInput(query)
  }

  function writeQuery(value) {
    const nextQuery = value.trim()
    if (nextQuery === query) return

    setSearchParams(
      (params) => {
        if (nextQuery) params.set(SEARCH_PARAM, nextQuery)
        else params.delete(SEARCH_PARAM)
        return params
      },
      // One history entry per visit, not one per pause in typing. `flushSync` renders the new
      // URL straight away instead of in a transition, so a filter change made right after
      // starts from it rather than from the previous URL.
      { replace: true, flushSync: true },
    )
  }

  const debouncedInput = useDebouncedValue(input, SEARCH_DEBOUNCE_MS)
  const onInputSettled = useEffectEvent(writeQuery)
  useEffect(() => {
    // From a microtask, because React cannot flushSync (see writeQuery) while it is still
    // running effects.
    queueMicrotask(() => onInputSettled(debouncedInput))
  }, [debouncedInput])

  // Sets the box's text and searches for it immediately (for Enter and clearing).
  function applyInput(value) {
    setInput(value)
    writeQuery(value)
  }

  return { query, input, setInput, applyInput }
}
