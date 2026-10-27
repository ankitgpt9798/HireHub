import { describe, expect, it } from 'vitest'
import { companies, mockJobs } from '../data/mockJobs.js'
import {
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  WORK_ARRANGEMENT_LABELS,
} from '../utils/formatJob.js'

function expectNonEmptyText(value) {
  expect(value).toEqual(expect.any(String))
  expect(value.trim()).not.toBe('')
}

function expectNonEmptyTextList(values) {
  expect(Array.isArray(values)).toBe(true)
  expect(values.length).toBeGreaterThan(0)
  values.forEach(expectNonEmptyText)
}

describe('mock companies', () => {
  const companyList = Object.values(companies)

  it('have unique ids', () => {
    const ids = companyList.map((company) => company.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(companyList.map((company) => [company.name, company]))('%s has complete details', (name, company) => {
    for (const field of ['id', 'name', 'industry', 'size', 'headquarters', 'about']) {
      expectNonEmptyText(company[field])
    }
  })
})

describe('mock jobs', () => {
  it('has enough listings to search, filter, and page through', () => {
    expect(mockJobs.length).toBeGreaterThanOrEqual(20)
  })

  it('uses unique ids', () => {
    const ids = mockJobs.map((job) => job.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(mockJobs.map((job) => [job.id, job]))('%s is a complete, valid listing', (id, job) => {
    for (const field of ['id', 'title', 'location', 'description']) {
      expectNonEmptyText(job[field])
    }
    expect(Object.values(companies)).toContain(job.company)
    expect(Object.keys(WORK_ARRANGEMENT_LABELS)).toContain(job.workArrangement)
    expect(Object.keys(EMPLOYMENT_TYPE_LABELS)).toContain(job.employmentType)
    expect(Object.keys(EXPERIENCE_LEVEL_LABELS)).toContain(job.experienceLevel)

    expectNonEmptyTextList(job.skills)
    expect(new Set(job.skills).size).toBe(job.skills.length)
    expectNonEmptyTextList(job.responsibilities)
    expectNonEmptyTextList(job.qualifications)

    const postedAt = new Date(job.postedAt)
    expect(Number.isNaN(postedAt.getTime())).toBe(false)
    expect(postedAt.getTime()).toBeLessThanOrEqual(Date.now())

    if (job.salary !== null) {
      expect(job.salary.currency).toBe('USD')
      expect(['year', 'hour']).toContain(job.salary.period)
      expect(job.salary.min).toBeGreaterThan(0)
      expect(job.salary.max).toBeGreaterThanOrEqual(job.salary.min)
    }
  })

  it('is ordered newest first', () => {
    const times = mockJobs.map((job) => new Date(job.postedAt).getTime())
    expect(times).toEqual([...times].sort((a, b) => b - a))
  })

  it.each([
    ['work arrangement', 'workArrangement', WORK_ARRANGEMENT_LABELS],
    ['employment type', 'employmentType', EMPLOYMENT_TYPE_LABELS],
    ['experience level', 'experienceLevel', EXPERIENCE_LEVEL_LABELS],
  ])('includes every %s', (label, field, labels) => {
    const values = new Set(mockJobs.map((job) => job[field]))
    expect([...values].sort()).toEqual(Object.keys(labels).sort())
  })

  it('includes listings with and without a salary', () => {
    expect(mockJobs.some((job) => job.salary === null)).toBe(true)
    expect(mockJobs.some((job) => job.salary?.period === 'year')).toBe(true)
    expect(mockJobs.some((job) => job.salary?.period === 'hour')).toBe(true)
  })
})
