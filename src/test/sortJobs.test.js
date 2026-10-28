import { describe, expect, it } from 'vitest'
import { mockJobs } from '../data/mockJobs.js'
import { DEFAULT_SORT, SORT_OPTIONS, sortJobs } from '../utils/sortJobs.js'

const NOW = Date.parse('2026-10-28T12:00:00Z')

function daysAgo(days) {
  return new Date(NOW - days * 24 * 60 * 60 * 1000).toISOString()
}

function makeJob(id, overrides) {
  return {
    id,
    title: 'Software Engineer',
    company: { id: 'acme', name: 'Acme Widgets' },
    location: 'Denver, CO',
    workArrangement: 'on-site',
    employmentType: 'full-time',
    experienceLevel: 'mid',
    salary: null,
    skills: [],
    postedAt: daysAgo(1),
    ...overrides,
  }
}

function ids(jobs) {
  return jobs.map((job) => job.id)
}

describe('sort options', () => {
  it('offers relevance, newest, and highest salary, with relevance as the default', () => {
    expect(SORT_OPTIONS).toEqual([
      { value: 'relevance', label: 'Most relevant' },
      { value: 'newest', label: 'Newest' },
      { value: 'salary', label: 'Highest salary' },
    ])
    expect(DEFAULT_SORT).toBe('relevance')
  })
})

describe('sortJobs', () => {
  it('returns a new array and leaves the original order alone', () => {
    const jobs = [makeJob('old', { postedAt: daysAgo(9) }), makeJob('new', { postedAt: daysAgo(1) })]
    const sorted = sortJobs(jobs, 'newest')

    expect(ids(sorted)).toEqual(['new', 'old'])
    expect(ids(jobs)).toEqual(['old', 'new'])
    expect(sortJobs(jobs, 'relevance')).not.toBe(jobs)
  })

  it('handles an empty list', () => {
    for (const { value } of SORT_OPTIONS) expect(sortJobs([], value)).toEqual([])
  })

  it('rejects a sort order it does not know', () => {
    expect(() => sortJobs([makeJob('a')], 'alphabetical')).toThrow('Unknown sort order: alphabetical')
  })

  describe('newest', () => {
    it('puts the most recently posted jobs first and keeps the order of exact ties', () => {
      const jobs = [
        makeJob('week', { postedAt: daysAgo(7) }),
        makeJob('hour', { postedAt: daysAgo(1 / 24) }),
        makeJob('day-a', { postedAt: daysAgo(1) }),
        makeJob('month', { postedAt: daysAgo(30) }),
        makeJob('day-b', { postedAt: daysAgo(1) }),
      ]

      expect(ids(sortJobs(jobs, 'newest'))).toEqual(['hour', 'day-a', 'day-b', 'week', 'month'])
    })
  })

  describe('highest salary', () => {
    it('puts the highest top of the pay range first, counting hourly pay as full-time', () => {
      const jobs = [
        makeJob('yearly-120k', { salary: { min: 100000, max: 120000, currency: 'USD', period: 'year' } }),
        // $70 an hour is $145,600 a year.
        makeJob('hourly-70', { salary: { min: 50, max: 70, currency: 'USD', period: 'hour' } }),
        makeJob('yearly-200k', { salary: { min: 90000, max: 200000, currency: 'USD', period: 'year' } }),
        makeJob('yearly-140k', { salary: { min: 140000, max: 140000, currency: 'USD', period: 'year' } }),
      ]

      expect(ids(sortJobs(jobs, 'salary'))).toEqual([
        'yearly-200k',
        'hourly-70',
        'yearly-140k',
        'yearly-120k',
      ])
    })

    it('puts listings without a salary last, and breaks ties newest first', () => {
      const pay = { min: 80000, max: 100000, currency: 'USD', period: 'year' }
      const jobs = [
        makeJob('unlisted-new', { postedAt: daysAgo(1) }),
        makeJob('paid-old', { salary: pay, postedAt: daysAgo(10) }),
        makeJob('unlisted-old', { postedAt: daysAgo(10) }),
        makeJob('paid-new', { salary: pay, postedAt: daysAgo(2) }),
      ]

      expect(ids(sortJobs(jobs, 'salary'))).toEqual([
        'paid-new',
        'paid-old',
        'unlisted-new',
        'unlisted-old',
      ])
    })

    it('orders the sample listings by pay', () => {
      const sorted = sortJobs(mockJobs, 'salary')

      expect(sorted[0].title).toBe('Engineering Manager, Payments')
      expect(sorted.slice(-3).every((job) => job.salary === null)).toBe(true)
      expect(sorted).toHaveLength(mockJobs.length)
    })
  })

  describe('relevance', () => {
    it('is newest first without a search or chosen skills', () => {
      const jobs = [
        makeJob('old', { postedAt: daysAgo(20) }),
        makeJob('new', { postedAt: daysAgo(2) }),
      ]

      expect(ids(sortJobs(jobs, 'relevance'))).toEqual(['new', 'old'])
      expect(ids(sortJobs(mockJobs, 'relevance'))).toEqual(ids(mockJobs))
    })

    it('ranks a match in the title above one in a skill, and a skill above the location', () => {
      const jobs = [
        makeJob('location', { location: 'Portland, OR', postedAt: daysAgo(1) }),
        makeJob('skill', { skills: ['Portland Tools'], postedAt: daysAgo(2) }),
        makeJob('title', { title: 'Portland Field Engineer', postedAt: daysAgo(3) }),
      ]

      expect(ids(sortJobs(jobs, 'relevance', { query: 'portland' }))).toEqual([
        'title',
        'skill',
        'location',
      ])
    })

    it('ranks a whole-word match above a match at the start of a longer word', () => {
      const jobs = [
        makeJob('javascript', { skills: ['JavaScript'], postedAt: daysAgo(1) }),
        makeJob('java', { skills: ['Java'], postedAt: daysAgo(5) }),
      ]

      expect(ids(sortJobs(jobs, 'relevance', { query: 'java' }))).toEqual(['java', 'javascript'])
    })

    it('adds up the words of the search and breaks ties newest first', () => {
      const jobs = [
        makeJob('one-word', { title: 'Senior Analyst', postedAt: daysAgo(1) }),
        makeJob('both-older', { title: 'Senior Data Analyst', postedAt: daysAgo(4) }),
        makeJob('both-newer', { title: 'Senior Data Engineer', postedAt: daysAgo(2) }),
      ]

      expect(ids(sortJobs(jobs, 'relevance', { query: 'senior data' }))).toEqual([
        'both-newer',
        'both-older',
        'one-word',
      ])
    })

    it('puts jobs that list more of the chosen skills first', () => {
      const jobs = [
        makeJob('one', { skills: ['React'], postedAt: daysAgo(1) }),
        makeJob('three', { skills: ['react', 'Node.js', 'TypeScript'], postedAt: daysAgo(6) }),
        makeJob('two', { skills: ['TypeScript', 'React'], postedAt: daysAgo(3) }),
      ]

      expect(
        ids(sortJobs(jobs, 'relevance', { skills: ['React', 'TypeScript', 'Node.js'] })),
      ).toEqual(['three', 'two', 'one'])
    })

    it('ranks the sample listings for a search', () => {
      const engineers = sortJobs(
        mockJobs.filter((job) => /engineer/i.test(job.title)),
        'relevance',
        { query: 'engineer' },
      )

      // "Engineer" as a whole word in the title beats "Engineering".
      expect(engineers.slice(-2).map((job) => job.title)).toEqual([
        'Software Engineering Intern',
        'Engineering Manager, Payments',
      ])
    })
  })
})
