import { useSearchParams } from 'react-router'
import { pageFromParams, writePageToParams } from '../utils/resultsParams.js'

// The page of results to show, kept in the URL (`?page=2`) so a page can be shared, reloaded,
// and stepped through with Back and Forward. Returns `[page, pageLink]`: `pageLink(n)` is the
// link target for page `n`, keeping the search, filters, and sort order.
export function useResultsPage() {
  const [searchParams] = useSearchParams()
  const page = pageFromParams(searchParams)

  function pageLink(pageNumber) {
    const search = writePageToParams(new URLSearchParams(searchParams), pageNumber).toString()
    return { search: search ? `?${search}` : '' }
  }

  return [page, pageLink]
}
