import {
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  WORK_ARRANGEMENT_LABELS,
} from './formatJob.js'

const DAY_MS = 24 * 60 * 60 * 1000

// Hourly pay is compared as full-time yearly pay: 40 hours a week for 52 weeks.
export const HOURS_PER_YEAR = 2080

// Filters that pick values of one job field. A job passes when it has any of the chosen values.
export const CHOICE_FILTERS = {
  workArrangements: {
    title: 'Work arrangement',
    field: 'workArrangement',
    labels: WORK_ARRANGEMENT_LABELS,
  },
  employmentTypes: {
    title: 'Employment type',
    field: 'employmentType',
    labels: EMPLOYMENT_TYPE_LABELS,
  },
  experienceLevels: {
    title: 'Experience level',
    field: 'experienceLevel',
    labels: EXPERIENCE_LEVEL_LABELS,
  },
}

// Minimum yearly pay, in USD.
export const SALARY_OPTIONS = [
  { value: 50000, label: '$50K+' },
  { value: 75000, label: '$75K+' },
  { value: 100000, label: '$100K+' },
  { value: 150000, label: '$150K+' },
  { value: 200000, label: '$200K+' },
]

// How recently a job was posted, in days.
export const POSTED_WITHIN_OPTIONS = [
  { value: 1, label: 'Past 24 hours' },
  { value: 3, label: 'Past 3 days' },
  { value: 7, label: 'Past week' },
  { value: 14, label: 'Past 2 weeks' },
  { value: 30, label: 'Past month' },
]

// No filters. `skillMatch` is 'all' (a job must list every chosen skill) or 'any' (at least one).
// Treat filter objects as read-only: the helpers below return new ones.
export const EMPTY_FILTERS = {
  workArrangements: [],
  employmentTypes: [],
  experienceLevels: [],
  minSalary: null,
  postedWithin: null,
  skills: [],
  skillMatch: 'all',
}

// The groups that combine with AND: a job has to pass every one of them.
const FILTER_GROUPS = [...Object.keys(CHOICE_FILTERS), 'minSalary', 'postedWithin', 'skills']

// The top of a job's pay range, per year.
function yearlyPay(salary) {
  return salary.period === 'hour' ? salary.max * HOURS_PER_YEAR : salary.max
}

function hasSkill(job, skill) {
  const wanted = skill.toLowerCase()
  return job.skills.some((jobSkill) => jobSkill.toLowerCase() === wanted)
}

// Whether `job` passes one group of filters. A group with nothing chosen passes every job.
function matchesGroup(job, group, filters, now) {
  switch (group) {
    case 'minSalary':
      // The salary filter asks whether the pay range reaches the amount, so jobs without a
      // listed salary cannot pass it.
      return (
        filters.minSalary == null ||
        (job.salary != null && yearlyPay(job.salary) >= filters.minSalary)
      )
    case 'postedWithin':
      return (
        filters.postedWithin == null ||
        now - new Date(job.postedAt) < filters.postedWithin * DAY_MS
      )
    case 'skills': {
      const { skills, skillMatch } = filters
      if (skills.length === 0) return true
      const matches = (skill) => hasSkill(job, skill)
      return skillMatch === 'any' ? skills.some(matches) : skills.every(matches)
    }
    default: {
      const values = filters[group]
      return values.length === 0 || values.includes(job[CHOICE_FILTERS[group].field])
    }
  }
}

function matchesFilters(job, filters, now, ignoredGroup) {
  return FILTER_GROUPS.every(
    (group) => group === ignoredGroup || matchesGroup(job, group, filters, now),
  )
}

function hasActiveFilters(filters) {
  return FILTER_GROUPS.some((group) => {
    const value = filters[group]
    return Array.isArray(value) ? value.length > 0 : value != null
  })
}

// The jobs that pass every filter group, in their original order. Choices within a group
// combine with OR ("Remote" or "Hybrid"), and groups combine with AND. Without active filters
// it returns `jobs` itself.
export function filterJobs(jobs, filters, now = new Date()) {
  if (!hasActiveFilters(filters)) return jobs
  return jobs.filter((job) => matchesFilters(job, filters, now))
}

function optionLabel(options, value) {
  return options.find((option) => option.value === value).label
}

// One entry per chosen filter value, in the order the filter panel shows them, for the
// removable filter chips: `{ group, value, label }`.
export function getActiveFilters(filters) {
  const active = []
  for (const [group, { labels }] of Object.entries(CHOICE_FILTERS)) {
    for (const value of filters[group]) active.push({ group, value, label: labels[value] })
  }
  if (filters.minSalary != null) {
    const label = `${optionLabel(SALARY_OPTIONS, filters.minSalary)} per year`
    active.push({ group: 'minSalary', value: filters.minSalary, label })
  }
  if (filters.postedWithin != null) {
    const label = optionLabel(POSTED_WITHIN_OPTIONS, filters.postedWithin)
    active.push({ group: 'postedWithin', value: filters.postedWithin, label })
  }
  for (const skill of filters.skills) active.push({ group: 'skills', value: skill, label: skill })
  return active
}

// Adds `value` to a group that allows several choices, or removes it if it is already chosen.
export function toggleFilterValue(filters, group, value) {
  const values = filters[group]
  return {
    ...filters,
    [group]: values.includes(value) ? values.filter((v) => v !== value) : [...values, value],
  }
}

// Removes one entry from `getActiveFilters`.
export function removeFilter(filters, { group, value }) {
  const current = filters[group]
  return {
    ...filters,
    [group]: Array.isArray(current) ? current.filter((v) => v !== value) : null,
  }
}

function tally(values) {
  const counts = {}
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1
  return counts
}

// The number shown next to each filter option: how many of `jobs` would match if that option
// were the only choice in its group, with every other group left as it is. Returns
// `{ [group]: { [option value]: count } }`; options that no job has are left out.
export function getFilterCounts(jobs, filters, now = new Date()) {
  const jobsIgnoring = (group) => jobs.filter((job) => matchesFilters(job, filters, now, group))
  const countOptions = (group, options) => {
    const candidates = jobsIgnoring(group)
    return Object.fromEntries(
      options.map(({ value }) => [
        value,
        candidates.filter((job) => matchesGroup(job, group, { [group]: value }, now)).length,
      ]),
    )
  }

  const counts = {}
  for (const [group, { field }] of Object.entries(CHOICE_FILTERS)) {
    counts[group] = tally(jobsIgnoring(group).map((job) => job[field]))
  }
  counts.minSalary = countOptions('minSalary', SALARY_OPTIONS)
  counts.postedWithin = countOptions('postedWithin', POSTED_WITHIN_OPTIONS)
  counts.skills = tally(jobsIgnoring('skills').flatMap((job) => job.skills))
  return counts
}

// Every skill listed in `jobs`, most common first, with ties in alphabetical order.
export function getSkillOptions(jobs) {
  const counts = tally(jobs.flatMap((job) => job.skills))
  return Object.keys(counts).sort(
    (a, b) => counts[b] - counts[a] || a.localeCompare(b, 'en', { sensitivity: 'base' }),
  )
}
