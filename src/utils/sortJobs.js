import { hasSkill, yearlyPay } from './filterJobs.js'
import { relevanceScorer } from './searchJobs.js'

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most relevant' },
  { value: 'newest', label: 'Newest' },
  { value: 'salary', label: 'Highest salary' },
]

export const DEFAULT_SORT = 'relevance'

// Orders `jobs` by `key(job)`, highest first. Ties go newest first, then keep their original
// order. Returns a new array.
function sortByDescending(jobs, key) {
  return jobs
    .map((job) => ({ job, key: key(job), postedAt: Date.parse(job.postedAt) }))
    .sort((a, b) => b.key - a.key || b.postedAt - a.postedAt)
    .map(({ job }) => job)
}

// `jobs` in the chosen order, as a new array:
// - 'relevance': best match for the search `query` first (see `relevanceScorer`), with a point
//   for each chosen skill in `skills` the job lists, so "any selected skill" puts jobs with
//   more of them first. Without a query or skills, this is the same as 'newest'.
// - 'newest': most recently posted first.
// - 'salary': highest pay first, by the top of the range per year (hourly pay counts as
//   full-time, as in the salary filter). Listings without a salary go last.
export function sortJobs(jobs, sort, { query = '', skills = [] } = {}) {
  switch (sort) {
    case 'relevance': {
      const score = relevanceScorer(query)
      return sortByDescending(
        jobs,
        (job) => score(job) + skills.filter((skill) => hasSkill(job, skill)).length,
      )
    }
    case 'newest':
      return sortByDescending(jobs, (job) => Date.parse(job.postedAt))
    case 'salary':
      return sortByDescending(jobs, (job) => (job.salary ? yearlyPay(job.salary) : 0))
    default:
      throw new Error(`Unknown sort order: ${sort}`)
  }
}
