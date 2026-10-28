import { DEFAULT_SORT, SORT_OPTIONS } from './sortJobs.js'

// URL search parameters for how the results are shown: `?sort=newest&page=2`. Each one is
// left out of the URL when it has its default value.
export const SORT_PARAM = 'sort'
export const PAGE_PARAM = 'page'

// The sort order in `params`, or the default when it is missing or not one the app offers.
export function sortFromParams(params) {
  const sort = params.get(SORT_PARAM)
  return SORT_OPTIONS.some((option) => option.value === sort) ? sort : DEFAULT_SORT
}

// Writes `sort` into `params` and returns it, leaving other parameters as they are.
export function writeSortToParams(params, sort) {
  if (sort === DEFAULT_SORT) params.delete(SORT_PARAM)
  else params.set(SORT_PARAM, sort)
  return params
}

// The page number in `params`: a whole number from 1, or 1 when it is missing or invalid.
export function pageFromParams(params) {
  const value = params.get(PAGE_PARAM) ?? ''
  const page = Number(value)
  return /^[1-9]\d*$/.test(value) && Number.isSafeInteger(page) ? page : 1
}

// Writes `page` into `params` and returns it, leaving other parameters as they are.
export function writePageToParams(params, page) {
  if (page === 1) params.delete(PAGE_PARAM)
  else params.set(PAGE_PARAM, String(page))
  return params
}
