import { useSearchParams } from 'react-router'
import { sortFromParams, writePageToParams, writeSortToParams } from '../utils/resultsParams.js'

// The results' sort order, kept in the URL (`?sort=newest`) next to the search and filters.
// Returns `[sort, setSort]`. A new order starts again from the first page and, like a filter
// change, replaces the current history entry.
export function useSortOrder() {
  const [searchParams, setSearchParams] = useSearchParams()
  const sort = sortFromParams(searchParams)

  function setSort(nextSort) {
    setSearchParams(
      (params) => writePageToParams(writeSortToParams(params, nextSort), 1),
      // `flushSync` renders the change straight away instead of in a transition, so the select
      // shows the new order at once (see useJobFilters).
      { replace: true, flushSync: true },
    )
  }

  return [sort, setSort]
}
