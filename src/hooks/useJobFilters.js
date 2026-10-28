import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { filtersFromParams, writeFiltersToParams } from '../utils/filterParams.js'
import { writePageToParams } from '../utils/resultsParams.js'

// Job filters kept in the URL next to the search query, so they survive a reload or a trip to
// a job's details page and back. `skillNames` lists the skills that can be chosen.
//
// Returns `[filters, updateFilters]`. `updateFilters` takes a function from the current
// filters to the new ones. Like typing in the search box, changing filters replaces the
// current history entry, so Back leaves the page instead of undoing filters one by one, and
// shows the results from their first page.
export function useJobFilters(skillNames) {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(
    () => filtersFromParams(searchParams, skillNames),
    [searchParams, skillNames],
  )

  function updateFilters(update) {
    setSearchParams(
      (params) => {
        const nextFilters = update(filtersFromParams(params, skillNames))
        return writePageToParams(writeFiltersToParams(params, nextFilters), 1)
      },
      // `flushSync` renders the change straight away instead of in a transition. Otherwise a
      // checkbox shows its old state until the transition finishes, and a quick second change
      // (such as removing two chips in a row) would start from the outdated URL and undo the first.
      { replace: true, flushSync: true },
    )
  }

  return [filters, updateFilters]
}
