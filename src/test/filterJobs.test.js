import { describe, expect, it } from 'vitest'
import {
  EMPTY_FILTERS,
  filterJobs,
  getActiveFilters,
  getFilterCounts,
  getSkillOptions,
  HOURS_PER_YEAR,
  removeFilter,
  toggleFilterValue,
} from '../utils/filterJobs.js'

const NOW = new Date('2026-10-28T12:00:00Z')
const HOUR_MS = 60 * 60 * 1000

function hoursAgo(hours) {
  return new Date(NOW.getTime() - hours * HOUR_MS).toISOString()
}

function yearly(min, max) {
  return { min, max, currency: 'USD', period: 'year' }
}

function hourly(min, max) {
  return { min, max, currency: 'USD', period: 'hour' }
}

function makeJob(id, overrides) {
  return {
    id,
    workArrangement: 'on-site',
    employmentType: 'full-time',
    experienceLevel: 'mid',
    salary: null,
    skills: [],
    postedAt: hoursAgo(1),
    ...overrides,
  }
}

const jobs = [
  makeJob('remote-react', {
    workArrangement: 'remote',
    experienceLevel: 'senior',
    salary: yearly(140000, 160000),
    skills: ['React', 'TypeScript'],
    postedAt: hoursAgo(5),
  }),
  makeJob('hybrid-python', {
    workArrangement: 'hybrid',
    salary: yearly(90000, 110000),
    skills: ['Python', 'SQL'],
    postedAt: hoursAgo(30),
  }),
  makeJob('contract-react', {
    workArrangement: 'remote',
    employmentType: 'contract',
    // 60 × 2,080 hours = $124,800 a year.
    salary: hourly(50, 60),
    skills: ['React', 'CSS'],
    postedAt: hoursAgo(5 * 24),
  }),
  makeJob('intern', {
    employmentType: 'internship',
    experienceLevel: 'entry',
    salary: hourly(20, 25),
    skills: ['Python'],
    postedAt: hoursAgo(20 * 24),
  }),
  makeJob('no-salary', {
    workArrangement: 'hybrid',
    experienceLevel: 'lead',
    skills: ['SQL', 'TypeScript'],
    postedAt: hoursAgo(40 * 24),
  }),
]

function filtered(filters, list = jobs) {
  return filterJobs(list, { ...EMPTY_FILTERS, ...filters }, NOW).map((job) => job.id)
}

describe('filterJobs', () => {
  it('returns the same list when no filters are set', () => {
    expect(filterJobs(jobs, EMPTY_FILTERS, NOW)).toBe(jobs)
    expect(filterJobs(jobs, { ...EMPTY_FILTERS, skillMatch: 'any' }, NOW)).toBe(jobs)
  })

  it('matches any of the values chosen within a group', () => {
    expect(filtered({ workArrangements: ['remote', 'hybrid'] })).toEqual([
      'remote-react',
      'hybrid-python',
      'contract-react',
      'no-salary',
    ])
    expect(filtered({ experienceLevels: ['entry', 'lead'] })).toEqual(['intern', 'no-salary'])
  })

  it('requires every group to match', () => {
    expect(filtered({ workArrangements: ['remote'], employmentTypes: ['full-time'] })).toEqual([
      'remote-react',
    ])
    expect(filtered({ skills: ['Python'], experienceLevels: ['entry'] })).toEqual(['intern'])
  })

  it('requires every chosen skill by default', () => {
    expect(filtered({ skills: ['React', 'TypeScript'] })).toEqual(['remote-react'])
  })

  it('accepts any chosen skill when skillMatch is "any"', () => {
    expect(filtered({ skills: ['React', 'TypeScript'], skillMatch: 'any' })).toEqual([
      'remote-react',
      'contract-react',
      'no-salary',
    ])
  })

  it('matches skills regardless of case', () => {
    expect(filtered({ skills: ['react'] })).toEqual(['remote-react', 'contract-react'])
  })

  it('compares the top of the pay range per year, counting hourly pay as full-time', () => {
    expect(HOURS_PER_YEAR).toBe(2080)
    expect(filtered({ minSalary: 100000 })).toEqual(['remote-react', 'hybrid-python', 'contract-react'])
    expect(filtered({ minSalary: 124800 })).toEqual(['remote-react', 'contract-react'])
    expect(filtered({ minSalary: 124801 })).toEqual(['remote-react'])
  })

  it('leaves out listings without a salary only while a minimum salary is set', () => {
    expect(filtered({ minSalary: 50000 })).not.toContain('no-salary')
    expect(filtered({ workArrangements: ['hybrid'] })).toContain('no-salary')
  })

  it('keeps jobs posted less than the chosen number of days ago', () => {
    expect(filtered({ postedWithin: 1 })).toEqual(['remote-react'])
    expect(filtered({ postedWithin: 7 })).toEqual(['remote-react', 'hybrid-python', 'contract-react'])
    expect(filtered({ postedWithin: 30 })).toEqual([
      'remote-react',
      'hybrid-python',
      'contract-react',
      'intern',
    ])
  })

  it('treats a job posted exactly at the limit as too old, and a future date as new', () => {
    const edgeJobs = [
      makeJob('one-day-old', { postedAt: hoursAgo(24) }),
      makeJob('from-the-future', { postedAt: hoursAgo(-2) }),
    ]
    expect(filtered({ postedWithin: 1 }, edgeJobs)).toEqual(['from-the-future'])
  })

  it('returns a new list without changing the one it is given', () => {
    const original = [...jobs]
    const result = filterJobs(jobs, { ...EMPTY_FILTERS, workArrangements: ['remote'] }, NOW)
    expect(result).not.toBe(jobs)
    expect(jobs).toEqual(original)
  })
})

describe('getActiveFilters', () => {
  it('lists each chosen value with its label, in the order the panel shows them', () => {
    const filters = {
      ...EMPTY_FILTERS,
      skills: ['React', 'SQL'],
      postedWithin: 7,
      minSalary: 100000,
      workArrangements: ['remote'],
      experienceLevels: ['senior'],
    }

    expect(getActiveFilters(filters)).toEqual([
      { group: 'workArrangements', value: 'remote', label: 'Remote' },
      { group: 'experienceLevels', value: 'senior', label: 'Senior level' },
      { group: 'minSalary', value: 100000, label: '$100K+ per year' },
      { group: 'postedWithin', value: 7, label: 'Past week' },
      { group: 'skills', value: 'React', label: 'React' },
      { group: 'skills', value: 'SQL', label: 'SQL' },
    ])
  })

  it('is empty when nothing is chosen, whatever the skill matching mode', () => {
    expect(getActiveFilters(EMPTY_FILTERS)).toEqual([])
    expect(getActiveFilters({ ...EMPTY_FILTERS, skillMatch: 'any' })).toEqual([])
  })
})

describe('toggleFilterValue and removeFilter', () => {
  it('adds and removes values without changing the filters they are given', () => {
    const withRemote = toggleFilterValue(EMPTY_FILTERS, 'workArrangements', 'remote')
    expect(withRemote.workArrangements).toEqual(['remote'])
    expect(EMPTY_FILTERS.workArrangements).toEqual([])

    const withBoth = toggleFilterValue(withRemote, 'workArrangements', 'hybrid')
    expect(withBoth.workArrangements).toEqual(['remote', 'hybrid'])
    expect(toggleFilterValue(withBoth, 'workArrangements', 'remote').workArrangements).toEqual([
      'hybrid',
    ])
  })

  it('removes one value from a group, or clears a single-choice filter', () => {
    const filters = { ...EMPTY_FILTERS, skills: ['React', 'SQL'], minSalary: 75000 }

    expect(removeFilter(filters, { group: 'skills', value: 'React' })).toEqual({
      ...filters,
      skills: ['SQL'],
    })
    expect(removeFilter(filters, { group: 'minSalary', value: 75000 })).toEqual({
      ...filters,
      minSalary: null,
    })
  })
})

describe('getFilterCounts', () => {
  it('counts every option across the jobs when nothing is chosen', () => {
    const counts = getFilterCounts(jobs, EMPTY_FILTERS, NOW)

    expect(counts.workArrangements).toEqual({ remote: 2, hybrid: 2, 'on-site': 1 })
    expect(counts.employmentTypes).toEqual({ 'full-time': 3, contract: 1, internship: 1 })
    expect(counts.skills).toEqual({ React: 2, TypeScript: 2, Python: 2, SQL: 2, CSS: 1 })
    expect(counts.minSalary).toEqual({ 50000: 4, 75000: 3, 100000: 3, 150000: 1, 200000: 0 })
    expect(counts.postedWithin).toEqual({ 1: 1, 3: 2, 7: 3, 14: 3, 30: 4 })
  })

  it("ignores a group's own choices but applies every other group", () => {
    const counts = getFilterCounts(
      jobs,
      { ...EMPTY_FILTERS, workArrangements: ['remote'], experienceLevels: ['senior'] },
      NOW,
    )

    // Senior jobs, by arrangement: only the remote React role.
    expect(counts.workArrangements).toEqual({ remote: 1 })
    // Remote jobs, by level.
    expect(counts.experienceLevels).toEqual({ senior: 1, mid: 1 })
    // Remote senior jobs, by skill.
    expect(counts.skills).toEqual({ React: 1, TypeScript: 1 })
  })

  it('counts skills the same way whether all or any skills must match', () => {
    const filters = { ...EMPTY_FILTERS, workArrangements: ['remote'], skills: ['React', 'CSS'] }

    const all = getFilterCounts(jobs, filters, NOW).skills
    const any = getFilterCounts(jobs, { ...filters, skillMatch: 'any' }, NOW).skills
    expect(all).toEqual({ React: 2, TypeScript: 1, CSS: 1 })
    expect(any).toEqual(all)
  })
})

describe('getSkillOptions', () => {
  it('lists each skill once, most common first, with ties in alphabetical order', () => {
    expect(getSkillOptions(jobs)).toEqual(['Python', 'React', 'SQL', 'TypeScript', 'CSS'])
  })

  it('sorts ties without regard to case', () => {
    expect(getSkillOptions([makeJob('a', { skills: ['Docker', 'apis'] })])).toEqual(['apis', 'Docker'])
  })
})
