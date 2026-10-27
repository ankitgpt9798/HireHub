import { describe, expect, it } from 'vitest'
import { formatFullDate, formatPostedDate, formatSalary } from '../utils/formatJob.js'

describe('formatSalary', () => {
  it.each([
    [{ min: 145000, max: 175000, currency: 'USD', period: 'year' }, '$145K–$175K per year'],
    [{ min: 62000, max: 72500, currency: 'USD', period: 'year' }, '$62K–$72.5K per year'],
    [{ min: 45, max: 60, currency: 'USD', period: 'hour' }, '$45–$60 per hour'],
    [{ min: 90000, max: 90000, currency: 'USD', period: 'year' }, '$90K per year'],
  ])('formats %j as %j', (salary, expected) => {
    expect(formatSalary(salary)).toBe(expected)
  })

  it('returns null when the listing has no salary', () => {
    expect(formatSalary(null)).toBeNull()
  })
})

describe('formatPostedDate', () => {
  const SECOND = 1000
  const MINUTE = 60 * SECOND
  const HOUR = 60 * MINUTE
  const DAY = 24 * HOUR
  const now = new Date('2026-10-27T12:00:00Z')

  it.each([
    [0, 'just now'],
    [30 * SECOND, 'just now'],
    [5 * MINUTE, '5 minutes ago'],
    [3 * HOUR, '3 hours ago'],
    [23 * HOUR, '23 hours ago'],
    [DAY, 'yesterday'],
    [3 * DAY, '3 days ago'],
    [7 * DAY, 'last week'],
    [20 * DAY, '2 weeks ago'],
    [31 * DAY, 'last month'],
    [75 * DAY, '2 months ago'],
  ])('describes a job posted %i ms ago as %j', (elapsed, expected) => {
    expect(formatPostedDate(new Date(now - elapsed).toISOString(), now)).toBe(expected)
  })

  it('treats a date in the future as just posted', () => {
    expect(formatPostedDate(new Date(now.getTime() + HOUR).toISOString(), now)).toBe('just now')
  })
})

describe('formatFullDate', () => {
  it('formats a date for display', () => {
    expect(formatFullDate('2026-10-24T12:00:00Z')).toBe('Oct 24, 2026')
  })
})
