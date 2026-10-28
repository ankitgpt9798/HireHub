import { describe, expect, it } from 'vitest'
import {
  pageFromParams,
  sortFromParams,
  writePageToParams,
  writeSortToParams,
} from '../utils/resultsParams.js'

describe('sort order in the URL', () => {
  it('reads a sort order the app offers', () => {
    expect(sortFromParams(new URLSearchParams('sort=newest'))).toBe('newest')
    expect(sortFromParams(new URLSearchParams('sort=salary'))).toBe('salary')
    expect(sortFromParams(new URLSearchParams('sort=relevance'))).toBe('relevance')
  })

  it('falls back to relevance when the order is missing or unknown', () => {
    expect(sortFromParams(new URLSearchParams(''))).toBe('relevance')
    expect(sortFromParams(new URLSearchParams('sort=oldest'))).toBe('relevance')
    expect(sortFromParams(new URLSearchParams('sort=NEWEST'))).toBe('relevance')
  })

  it('writes the order and leaves the default out of the URL', () => {
    const params = new URLSearchParams('q=react&skill=AWS')

    expect(writeSortToParams(params, 'salary')).toBe(params)
    expect(params.toString()).toBe('q=react&skill=AWS&sort=salary')

    writeSortToParams(params, 'relevance')
    expect(params.toString()).toBe('q=react&skill=AWS')
  })
})

describe('page number in the URL', () => {
  it('reads a whole page number from 1', () => {
    expect(pageFromParams(new URLSearchParams('page=1'))).toBe(1)
    expect(pageFromParams(new URLSearchParams('page=2'))).toBe(2)
    expect(pageFromParams(new URLSearchParams('page=40'))).toBe(40)
  })

  it('reads page 1 when the number is missing or invalid', () => {
    for (const value of ['', '0', '-2', '1.5', '2e1', '02', 'abc', ' 2', '99999999999999999999']) {
      expect(pageFromParams(new URLSearchParams({ page: value }))).toBe(1)
    }
    expect(pageFromParams(new URLSearchParams('q=react'))).toBe(1)
  })

  it('writes the page and leaves page 1 out of the URL', () => {
    const params = new URLSearchParams('q=react&sort=newest')

    expect(writePageToParams(params, 3)).toBe(params)
    expect(params.toString()).toBe('q=react&sort=newest&page=3')

    writePageToParams(params, 1)
    expect(params.toString()).toBe('q=react&sort=newest')
  })
})
