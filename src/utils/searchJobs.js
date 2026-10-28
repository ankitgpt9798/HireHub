import {
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  WORK_ARRANGEMENT_LABELS,
} from './formatJob.js'

// Lowercases text and strips accents, so "Montréal" and "MONTREAL" both become "montreal".
function normalize(text) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// The text a search looks through: the title, company, location, and skills, plus the
// labels shown on the card, so searches such as "remote", "internship", or "senior" work too.
function searchableText(job) {
  return normalize(
    [
      job.title,
      job.company.name,
      job.location,
      WORK_ARRANGEMENT_LABELS[job.workArrangement],
      EMPLOYMENT_TYPE_LABELS[job.employmentType],
      EXPERIENCE_LEVEL_LABELS[job.experienceLevel],
      ...job.skills,
    ].join('\n'),
  )
}

// A term matches at the start of a word: "go" finds "Go" and "Golang" but not "Chicago".
function termPattern(term) {
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeRegExp(term)}`, 'u')
}

// The jobs that match a free-text search, in their original order. Matching ignores case and
// accents, and every word of the query has to match, so "senior react" finds senior roles
// that list React. A blank query returns `jobs` itself.
export function searchJobs(jobs, query) {
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return jobs

  const patterns = terms.map(termPattern)
  return jobs.filter((job) => {
    const text = searchableText(job)
    return patterns.every((pattern) => pattern.test(text))
  })
}
