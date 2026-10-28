import { describe, expect, it } from 'vitest'
import { mockJobs } from '../data/mockJobs.js'
import { relevanceScorer, searchJobs } from '../utils/searchJobs.js'

function makeJob(id, overrides) {
  return {
    id,
    title: 'Software Engineer',
    company: { id: 'acme', name: 'Acme Widgets' },
    location: 'Denver, CO',
    workArrangement: 'on-site',
    employmentType: 'full-time',
    experienceLevel: 'mid',
    skills: [],
    ...overrides,
  }
}

const jobs = [
  makeJob('frontend', {
    title: 'Senior Frontend Engineer',
    location: 'Remote (US)',
    workArrangement: 'remote',
    experienceLevel: 'senior',
    skills: ['React', 'TypeScript'],
  }),
  makeJob('backend', {
    title: 'Backend Engineer (Go)',
    company: { id: 'harborline', name: 'Harborline Freight' },
    location: 'Seattle, WA',
    skills: ['Go', 'PostgreSQL'],
  }),
  makeJob('intern', {
    title: 'Robotics Intern',
    location: 'Chicago, IL',
    employmentType: 'internship',
    experienceLevel: 'entry',
    skills: ['C++', 'Python'],
  }),
  makeJob('full-stack', {
    title: 'Full Stack Developer',
    location: 'Montréal, QC',
    workArrangement: 'hybrid',
    skills: ['Node.js', 'CI/CD', 'SQL'],
  }),
]

function searchIds(query, list = jobs) {
  return searchJobs(list, query).map((job) => job.id)
}

describe('searchJobs', () => {
  it('returns the same list when the query is empty or blank', () => {
    expect(searchJobs(jobs, '')).toBe(jobs)
    expect(searchJobs(jobs, '   ')).toBe(jobs)
  })

  it.each([
    ['title', 'frontend', ['frontend']],
    ['company', 'harborline', ['backend']],
    ['location', 'seattle', ['backend']],
    ['skill', 'typescript', ['frontend']],
    ['work arrangement', 'hybrid', ['full-stack']],
    ['employment type', 'internship', ['intern']],
    ['experience level', 'senior', ['frontend']],
  ])('matches on the %s', (_field, query, expected) => {
    expect(searchIds(query)).toEqual(expected)
  })

  it('ignores case', () => {
    expect(searchIds('REACT')).toEqual(['frontend'])
    expect(searchIds('hArBoRlInE fReIgHt')).toEqual(['backend'])
  })

  it('ignores accents in the query and the listings', () => {
    expect(searchIds('montreal')).toEqual(['full-stack'])
    expect(searchIds('MONTRÉAL')).toEqual(['full-stack'])
  })

  it('requires every word of the query to match, in any field', () => {
    expect(searchIds('senior react')).toEqual(['frontend'])
    expect(searchIds('remote typescript')).toEqual(['frontend'])
    expect(searchIds('engineer python')).toEqual([])
  })

  it('ignores extra whitespace between words', () => {
    expect(searchIds('  senior    react  ')).toEqual(['frontend'])
  })

  it('matches words by their beginning, not their middle', () => {
    expect(searchIds('front')).toEqual(['frontend'])
    expect(searchIds('go')).toEqual(['backend']) // not the job in Chicago
    expect(searchIds('end')).toEqual([])
  })

  it('matches terms that contain punctuation', () => {
    expect(searchIds('c++')).toEqual(['intern'])
    expect(searchIds('node.js')).toEqual(['full-stack'])
    expect(searchIds('ci/cd')).toEqual(['full-stack'])
    expect(searchIds('(go)')).toEqual(['backend'])
  })

  it('treats regular expression characters as plain text', () => {
    expect(() => searchJobs(jobs, '[(*+?\\')).not.toThrow()
    expect(searchIds('.*')).toEqual([])
    expect(searchIds('react|go')).toEqual([])
  })

  it('returns an empty list when nothing matches', () => {
    expect(searchIds('zzzz')).toEqual([])
  })

  it('keeps the original order and does not change the list it is given', () => {
    const original = [...jobs]
    expect(searchIds('engineer')).toEqual(['frontend', 'backend'])
    expect(jobs).toEqual(original)
  })

  it.each([
    ['react', ['job-001', 'job-006', 'job-013', 'job-015']],
    ['harborline', ['job-005', 'job-017', 'job-024']],
    ['new york', ['job-009', 'job-014']],
    ['remote python', ['job-019', 'job-021']],
    ['intern', ['job-008', 'job-020']],
  ])('finds the matching sample listings for "%s"', (query, expected) => {
    expect(searchIds(query, mockJobs)).toEqual(expected)
  })
})

describe('relevanceScorer', () => {
  const [frontend, backend, intern, fullStack] = jobs

  it('scores each word by the most telling field it matches, plus 1 for a whole word', () => {
    // Whole words: title 4, company or skill 3, location or card label 2.
    expect(relevanceScorer('frontend')(frontend)).toBe(4)
    expect(relevanceScorer('harborline')(backend)).toBe(3)
    expect(relevanceScorer('typescript')(frontend)).toBe(3)
    expect(relevanceScorer('seattle')(backend)).toBe(2)
    expect(relevanceScorer('internship')(intern)).toBe(2)
    // The start of a word: one point less.
    expect(relevanceScorer('front')(frontend)).toBe(3)
    expect(relevanceScorer('harbor')(backend)).toBe(2)
    expect(relevanceScorer('sea')(backend)).toBe(1)
  })

  it('uses the best field when a word matches in more than one', () => {
    // "intern" is a whole word in the title ("Robotics Intern") and also starts the
    // "Internship" label, which counts for less.
    expect(relevanceScorer('intern')(intern)).toBe(4)
  })

  it('adds up the words of the query', () => {
    expect(relevanceScorer('senior react')(frontend)).toBe(4 + 3)
    expect(relevanceScorer('remote typescript')(frontend)).toBe(2 + 3)
  })

  it('gives nothing for words that do not match, or for a blank query', () => {
    expect(relevanceScorer('python')(frontend)).toBe(0)
    expect(relevanceScorer('')(frontend)).toBe(0)
    expect(relevanceScorer('   ')(fullStack)).toBe(0)
  })

  it('ignores case and accents like the search does', () => {
    expect(relevanceScorer('MONTREAL')(fullStack)).toBe(2)
    expect(relevanceScorer('node.js')(fullStack)).toBe(3)
  })
})
