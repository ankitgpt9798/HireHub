import { describe, expect, it } from 'vitest'
import { getPageNumbers, PAGE_GAP, paginate } from '../utils/pagination.js'

const items = Array.from({ length: 25 }, (_, index) => index + 1)

describe('paginate', () => {
  it('returns the first page with its item positions and the page count', () => {
    expect(paginate(items, 1, 10)).toEqual({
      items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      pageCount: 3,
      firstItem: 1,
      lastItem: 10,
    })
  })

  it('returns a middle page', () => {
    const { items: pageItems, firstItem, lastItem } = paginate(items, 2, 10)

    expect(pageItems).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
    expect([firstItem, lastItem]).toEqual([11, 20])
  })

  it('returns a shorter last page', () => {
    const { items: pageItems, firstItem, lastItem } = paginate(items, 3, 10)

    expect(pageItems).toEqual([21, 22, 23, 24, 25])
    expect([firstItem, lastItem]).toEqual([21, 25])
  })

  it('has no items on a page past the end', () => {
    const page = paginate(items, 4, 10)

    expect(page.items).toEqual([])
    expect(page.pageCount).toBe(3)
  })

  it('counts exactly full pages without an extra empty one', () => {
    expect(paginate(items.slice(0, 20), 1, 10).pageCount).toBe(2)
    expect(paginate(items.slice(0, 10), 1, 10).pageCount).toBe(1)
  })

  it('has one empty page when there are no items', () => {
    expect(paginate([], 1, 10)).toEqual({ items: [], pageCount: 1, firstItem: 1, lastItem: 0 })
  })

  it('does not change the list', () => {
    const list = [3, 1, 2]
    paginate(list, 1, 2)
    expect(list).toEqual([3, 1, 2])
  })
})

describe('getPageNumbers', () => {
  it('lists every page up to seven pages', () => {
    expect(getPageNumbers(1, 1)).toEqual([1])
    expect(getPageNumbers(2, 4)).toEqual([1, 2, 3, 4])
    expect(getPageNumbers(7, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('leaves out later pages near the start', () => {
    expect(getPageNumbers(1, 10)).toEqual([1, 2, 3, 4, 5, PAGE_GAP, 10])
    expect(getPageNumbers(4, 10)).toEqual([1, 2, 3, 4, 5, PAGE_GAP, 10])
  })

  it('leaves out pages on both sides in the middle', () => {
    expect(getPageNumbers(5, 10)).toEqual([1, PAGE_GAP, 4, 5, 6, PAGE_GAP, 10])
    expect(getPageNumbers(6, 10)).toEqual([1, PAGE_GAP, 5, 6, 7, PAGE_GAP, 10])
  })

  it('leaves out earlier pages near the end', () => {
    expect(getPageNumbers(7, 10)).toEqual([1, PAGE_GAP, 6, 7, 8, 9, 10])
    expect(getPageNumbers(10, 10)).toEqual([1, PAGE_GAP, 6, 7, 8, 9, 10])
  })

  it('always has seven entries once pages are left out, and never hides just one page', () => {
    for (let pageCount = 8; pageCount <= 12; pageCount += 1) {
      for (let page = 1; page <= pageCount; page += 1) {
        const entries = getPageNumbers(page, pageCount)
        expect(entries).toHaveLength(7)
        expect(entries).toContain(page)

        // Each gap stands for at least two pages, or the page number itself would fit.
        entries.forEach((entry, index) => {
          if (entry === PAGE_GAP) expect(entries[index + 1] - entries[index - 1]).toBeGreaterThan(2)
        })
      }
    }
  })

  it('treats a page outside the range as the nearest end', () => {
    expect(getPageNumbers(0, 10)).toEqual(getPageNumbers(1, 10))
    expect(getPageNumbers(25, 10)).toEqual(getPageNumbers(10, 10))
  })
})
