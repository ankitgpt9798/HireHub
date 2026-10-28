import { describe, expect, it } from 'vitest'
import { EMPTY_FILTERS } from '../utils/filterJobs.js'
import { filtersFromParams, writeFiltersToParams } from '../utils/filterParams.js'

const SKILLS = ['React', 'SQL', 'Node.js']

function read(search) {
  return filtersFromParams(new URLSearchParams(search), SKILLS)
}

const ALL_FILTERS = {
  workArrangements: ['remote', 'hybrid'],
  employmentTypes: ['contract'],
  experienceLevels: ['senior'],
  minSalary: 100000,
  postedWithin: 7,
  skills: ['SQL', 'React'],
  skillMatch: 'any',
}

describe('filtersFromParams', () => {
  it('reads every filter from the URL', () => {
    expect(
      read(
        'arrangement=hybrid&arrangement=remote&type=contract&level=senior&salary=100000&posted=7' +
          '&skill=SQL&skill=React&match=any',
      ),
    ).toEqual(ALL_FILTERS)
  })

  it('returns no filters when the URL has none', () => {
    expect(read('')).toEqual(EMPTY_FILTERS)
    expect(read('q=react')).toEqual(EMPTY_FILTERS)
  })

  it('ignores values the app does not offer', () => {
    expect(
      read(
        'arrangement=moon&type=&level=SENIOR&salary=12345&posted=2&skill=Cobol&skill=&match=some',
      ),
    ).toEqual(EMPTY_FILTERS)
    expect(read('salary=abc&posted=-7')).toEqual(EMPTY_FILTERS)
  })

  it('lists choices in display order, once each', () => {
    expect(read('level=lead&level=entry&level=lead').experienceLevels).toEqual(['entry', 'lead'])
  })

  it('matches skill names ignoring case and spaces, keeping the order they were chosen', () => {
    expect(read('skill=sql&skill=%20node.JS%20&skill=SQL').skills).toEqual(['SQL', 'Node.js'])
  })
})

describe('writeFiltersToParams', () => {
  it('writes every filter and keeps unrelated parameters', () => {
    const params = writeFiltersToParams(new URLSearchParams('q=react&arrangement=on-site'), ALL_FILTERS)

    expect(params.toString()).toBe(
      'q=react&arrangement=remote&arrangement=hybrid&type=contract&level=senior' +
        '&skill=SQL&skill=React&salary=100000&posted=7&match=any',
    )
  })

  it('removes filter parameters when the filters are cleared', () => {
    const params = new URLSearchParams('q=react&arrangement=remote&skill=SQL&match=any&page=2')

    expect(writeFiltersToParams(params, EMPTY_FILTERS).toString()).toBe('q=react&page=2')
  })

  it('round-trips through the URL', () => {
    const params = writeFiltersToParams(new URLSearchParams(), ALL_FILTERS)
    expect(filtersFromParams(params, SKILLS)).toEqual(ALL_FILTERS)
  })
})
