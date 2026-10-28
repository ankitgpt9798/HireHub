// Marks the places where `getPageNumbers` leaves page numbers out.
export const PAGE_GAP = 'gap'

// Up to this many pages, `getPageNumbers` lists every one.
const MAX_PAGE_ENTRIES = 7

function range(first, last) {
  return Array.from({ length: last - first + 1 }, (_, index) => first + index)
}

// One page of `items`, with pages counted from 1. Returns the page's items, how many pages
// there are (at least 1, even with nothing to show), and the positions of the page's first
// and last items, counted from 1, for "showing 13–24". A page past the end has no items.
export function paginate(items, page, pageSize) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const start = (page - 1) * pageSize
  const pageItems = items.slice(start, start + pageSize)
  return {
    items: pageItems,
    pageCount,
    firstItem: start + 1,
    lastItem: start + pageItems.length,
  }
}

// The entries of a pagination bar. Up to seven pages are all listed. Beyond that it keeps the
// first and last pages and the current page with its neighbours, with `PAGE_GAP` for the
// pages left out, and always has seven entries so the bar keeps its width:
// [1, PAGE_GAP, 4, 5, 6, PAGE_GAP, 10].
export function getPageNumbers(page, pageCount) {
  if (pageCount <= MAX_PAGE_ENTRIES) return range(1, pageCount)

  const current = Math.min(Math.max(page, 1), pageCount)
  if (current <= 4) return [...range(1, 5), PAGE_GAP, pageCount]
  if (current >= pageCount - 3) return [1, PAGE_GAP, ...range(pageCount - 4, pageCount)]
  return [1, PAGE_GAP, current - 1, current, current + 1, PAGE_GAP, pageCount]
}
