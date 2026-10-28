import {
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  WORK_ARRANGEMENT_LABELS,
} from './formatJob.js'
import { normalizeText } from './normalizeText.js'

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// The text a search looks through, in groups from most to least telling: a word in the title
// says more about a job than a word in its location. The labels shown on the card are
// included so searches such as "remote", "internship", or "senior" work too.
function searchableFields(job) {
  return [
    { weight: 3, text: [job.title] },
    { weight: 2, text: [job.company.name, ...job.skills] },
    {
      weight: 1,
      text: [
        job.location,
        WORK_ARRANGEMENT_LABELS[job.workArrangement],
        EMPLOYMENT_TYPE_LABELS[job.employmentType],
        EXPERIENCE_LEVEL_LABELS[job.experienceLevel],
      ],
    },
  ].map(({ weight, text }) => ({ weight, text: normalizeText(text.join('\n')) }))
}

// A term matches at the start of a word: "go" finds "Go" and "Golang" but not "Chicago".
// `wholeWord` also needs the word to end with the term: "go" finds "Go" but not "Golang".
function termPattern(term, wholeWord = false) {
  const end = wholeWord ? '(?![\\p{L}\\p{N}])' : ''
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeRegExp(term)}${end}`, 'u')
}

// Each word of the query, ignoring case and accents.
function parseQuery(query) {
  return normalizeText(query)
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => ({ wordStart: termPattern(term), wholeWord: termPattern(term, true) }))
}

// How well one search term matches a job: the weight of the most telling field it matches,
// plus 1 when it matches a whole word there ("java" in "Java" rather than "JavaScript").
// 0 when it matches nowhere.
function termScore(fields, term) {
  let score = 0
  for (const { weight, text } of fields) {
    if (term.wholeWord.test(text)) score = Math.max(score, weight + 1)
    else if (term.wordStart.test(text)) score = Math.max(score, weight)
  }
  return score
}

// The jobs that match a free-text search, in their original order. Matching ignores case and
// accents, and every word of the query has to match, so "senior react" finds senior roles
// that list React. A blank query returns `jobs` itself.
export function searchJobs(jobs, query) {
  const terms = parseQuery(query)
  if (terms.length === 0) return jobs

  return jobs.filter((job) => {
    const fields = searchableFields(job)
    return terms.every((term) => termScore(fields, term) > 0)
  })
}

// A function that scores how well a job matches `query`, for sorting by relevance. Each word
// of the query scores by where it matches: 3 in the title, 2 in the company name or a skill,
// 1 in the location or a card label, plus 1 for a whole word. A blank query scores 0.
export function relevanceScorer(query) {
  const terms = parseQuery(query)
  return (job) => {
    const fields = searchableFields(job)
    return terms.reduce((total, term) => total + termScore(fields, term), 0)
  }
}
