// Display labels for a job's categorical fields, keyed by the values used in the job data.
export const WORK_ARRANGEMENT_LABELS = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  'on-site': 'On-site',
}

export const EMPLOYMENT_TYPE_LABELS = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
}

export const EXPERIENCE_LEVEL_LABELS = {
  entry: 'Entry level',
  mid: 'Mid level',
  senior: 'Senior level',
  lead: 'Lead',
}

const SALARY_PERIOD_LABELS = {
  year: 'per year',
  hour: 'per hour',
}

// "$145K–$175K per year", "$45–$60 per hour", or null when the listing has no salary.
export function formatSalary(salary) {
  if (!salary) return null

  const { min, max, currency, period } = salary
  const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  })
  const amount = min === max ? money.format(min) : `${money.format(min)}–${money.format(max)}`
  return `${amount} ${SALARY_PERIOD_LABELS[period]}`
}

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

// How long ago a job was posted: "just now", "5 hours ago", "yesterday", "last week", "2 months ago".
export function formatPostedDate(postedAt, now = new Date()) {
  // Future dates (for example from clock skew) count as just posted.
  const elapsed = Math.max(0, now - new Date(postedAt))

  if (elapsed < MINUTE_MS) return 'just now'
  if (elapsed < HOUR_MS) return relativeTime.format(-Math.floor(elapsed / MINUTE_MS), 'minute')
  if (elapsed < DAY_MS) return relativeTime.format(-Math.floor(elapsed / HOUR_MS), 'hour')

  const days = Math.floor(elapsed / DAY_MS)
  if (days < 7) return relativeTime.format(-days, 'day')
  if (days < 30) return relativeTime.format(-Math.floor(days / 7), 'week')
  return relativeTime.format(-Math.floor(days / 30), 'month')
}

const fullDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

// "Oct 24, 2026"
export function formatFullDate(date) {
  return fullDate.format(new Date(date))
}
