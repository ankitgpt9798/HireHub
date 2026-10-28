import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { mockJobs } from '../data/mockJobs.js'
import { sortJobs } from '../utils/sortJobs.js'
import { renderRoute } from './renderRoute.jsx'

// As on the Discover Jobs page.
const JOBS_PER_PAGE = 12

function titles(jobs) {
  return jobs.map((job) => job.title)
}

function getListings() {
  return screen.getByRole('region', { name: 'Job listings' })
}

function getListedTitles() {
  return within(getListings())
    .queryAllByRole('article')
    .map((card) => within(card).getByRole('heading', { level: 3 }).textContent)
}

function getResultsSummary() {
  return within(getListings()).getByRole('status')
}

function getSortSelect() {
  return screen.getByRole('combobox', { name: 'Sort by' })
}

function getPagination() {
  return screen.getByRole('navigation', { name: 'Job listing pages' })
}

function queryPagination() {
  return screen.queryByRole('navigation', { name: 'Job listing pages' })
}

function getListingsHeading() {
  return screen.getByRole('heading', { name: 'Job listings' })
}

describe('sorting the job listings', () => {
  it('offers the sort orders, with Most relevant chosen by default', () => {
    renderRoute('/jobs')

    expect(getSortSelect()).toHaveValue('relevance')
    expect(within(getSortSelect()).getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Most relevant',
      'Newest',
      'Highest salary',
    ])
    // Without a search, the most relevant listings are the newest.
    expect(getListedTitles()).toEqual(titles(mockJobs.slice(0, JOBS_PER_PAGE)))
  })

  it('sorts by highest salary and keeps the order in the URL', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/jobs')

    await user.selectOptions(getSortSelect(), 'Highest salary')

    expect(getSortSelect()).toHaveValue('salary')
    expect(getListedTitles().slice(0, 4)).toEqual([
      'Engineering Manager, Payments',
      'Machine Learning Engineer',
      'Senior iOS Engineer',
      // $90 an hour, about $187K a year.
      'Android Engineer',
    ])
    expect(router.state.location.search).toBe('?sort=salary')
    expect(router.state.historyAction).toBe('REPLACE')
  })

  it('ranks search results by relevance, or by date on request', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/jobs?q=java')

    // "Java" as a whole skill ranks above "JavaScript".
    expect(getListedTitles()).toEqual([
      'Engineering Manager, Payments',
      'Frontend Developer',
      'QA Automation Engineer',
      'Junior Web Developer',
    ])

    await user.selectOptions(getSortSelect(), 'Newest')

    expect(getListedTitles()).toEqual([
      'Frontend Developer',
      'Engineering Manager, Payments',
      'QA Automation Engineer',
      'Junior Web Developer',
    ])
    expect(router.state.location.search).toBe('?q=java&sort=newest')

    await user.selectOptions(getSortSelect(), 'Most relevant')
    expect(router.state.location.search).toBe('?q=java')
  })

  it('sorts the filtered results and keeps the filters when the order changes', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/jobs?arrangement=remote&sort=salary')
    const remoteJobs = mockJobs.filter((job) => job.workArrangement === 'remote')

    expect(getSortSelect()).toHaveValue('salary')
    expect(getListedTitles()).toEqual(titles(sortJobs(remoteJobs, 'salary')))

    await user.selectOptions(getSortSelect(), 'Newest')

    expect(getListedTitles()).toEqual(titles(remoteJobs))
    expect(router.state.location.search).toBe('?arrangement=remote&sort=newest')
    expect(screen.getByRole('button', { name: 'Remove filter: Remote' })).toBeInTheDocument()
  })

  it('ignores a sort order it does not offer', () => {
    renderRoute('/jobs?sort=oldest')
    expect(getSortSelect()).toHaveValue('relevance')
    expect(getListedTitles()).toEqual(titles(mockJobs.slice(0, JOBS_PER_PAGE)))
  })
})

describe('job listing pages', () => {
  it('shows the first page of listings with links to the others', () => {
    renderRoute('/jobs')
    const pagination = getPagination()

    expect(getListedTitles()).toHaveLength(JOBS_PER_PAGE)
    expect(getResultsSummary()).toHaveTextContent(
      `${mockJobs.length} listings, showing 1–${JOBS_PER_PAGE}`,
    )
    expect(within(pagination).getByRole('link', { name: 'Page 1' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(pagination).getByRole('link', { name: 'Page 2' })).toHaveAttribute(
      'href',
      '/jobs?page=2',
    )
    expect(within(pagination).getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(within(pagination).getByText('Page 1 of 2')).toBeInTheDocument()
  })

  it('moves to the next page, adds a history entry, and moves focus to the results', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/jobs')

    await user.click(within(getPagination()).getByRole('link', { name: 'Next page' }))

    expect(getListedTitles()).toEqual(titles(mockJobs.slice(JOBS_PER_PAGE)))
    expect(getResultsSummary()).toHaveTextContent(
      `${mockJobs.length} listings, showing 13–${mockJobs.length}`,
    )
    expect(getListingsHeading()).toHaveFocus()
    expect(router.state.location.search).toBe('?page=2')
    expect(router.state.historyAction).toBe('PUSH')
    expect(within(getPagination()).getByRole('link', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(getPagination()).getByRole('button', { name: 'Next page' })).toBeDisabled()

    await act(() => router.navigate(-1))

    expect(getListedTitles()).toEqual(titles(mockJobs.slice(0, JOBS_PER_PAGE)))
    expect(router.state.location.search).toBe('')
  })

  it('pages through filtered and sorted results, keeping the search, filters, and order', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/jobs?q=engineer&sort=salary')
    const engineerJobs = sortJobs(
      mockJobs.filter((job) => /\bengineer/i.test(job.title)),
      'salary',
    )
    expect(getResultsSummary()).toHaveTextContent(
      `15 of ${mockJobs.length} listings match “engineer”, showing 1–12`,
    )

    await user.click(within(getPagination()).getByRole('link', { name: 'Page 2' }))

    expect(getListedTitles()).toEqual(titles(engineerJobs.slice(JOBS_PER_PAGE)))
    expect(getResultsSummary()).toHaveTextContent(
      `15 of ${mockJobs.length} listings match “engineer”, showing 13–15`,
    )
    expect(router.state.location.search).toBe('?q=engineer&sort=salary&page=2')
    expect(screen.getByRole('searchbox', { name: 'Search jobs' })).toHaveValue('engineer')
    expect(getSortSelect()).toHaveValue('salary')
  })

  it('goes back to the first page when the sort order changes', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/jobs?page=2')

    await user.selectOptions(getSortSelect(), 'Newest')

    expect(router.state.location.search).toBe('?sort=newest')
    expect(getResultsSummary()).toHaveTextContent('showing 1–12')
  })

  it('goes back to the first page when a filter changes or is removed', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/jobs?type=full-time&page=2')
    expect(getResultsSummary()).toHaveTextContent('showing 13–18')
    const panel = screen.getByRole('complementary', { name: 'Filters' })

    await user.click(within(panel).getByRole('checkbox', { name: /^Contract/ }))
    expect(router.state.location.search).toBe('?type=full-time&type=contract')
    expect(getResultsSummary()).toHaveTextContent('showing 1–12')

    await act(() => router.navigate('/jobs?type=full-time&page=2'))
    await user.click(screen.getByRole('button', { name: 'Remove filter: Full-time' }))
    expect(router.state.location.search).toBe('')
    expect(getResultsSummary()).toHaveTextContent('showing 1–12')
  })

  it('goes back to the first page for a new search', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/jobs?page=2')

    await user.type(screen.getByRole('searchbox', { name: 'Search jobs' }), 'engineer{Enter}')

    expect(router.state.location.search).toBe('?q=engineer')
    expect(getResultsSummary()).toHaveTextContent('showing 1–12')
  })

  it('hides the page links when every result fits on one page', () => {
    renderRoute('/jobs?arrangement=remote')

    expect(getListedTitles()).toHaveLength(9)
    expect(getResultsSummary()).toHaveTextContent(
      new RegExp(`^9 of ${mockJobs.length} listings match your filters$`),
    )
    expect(queryPagination()).not.toBeInTheDocument()
  })

  it('explains a page past the end of the results and links back to real pages', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/jobs?sort=newest&page=5')
    const listings = getListings()

    expect(
      within(listings).getByRole('heading', { name: 'There are no jobs on page 5' }),
    ).toBeInTheDocument()
    expect(within(listings).getByText(/The results end on page 2\./)).toBeInTheDocument()
    expect(getListedTitles()).toEqual([])
    expect(queryPagination()).not.toBeInTheDocument()
    expect(getResultsSummary()).toHaveTextContent(new RegExp(`^${mockJobs.length} listings$`))
    expect(within(listings).getByRole('link', { name: 'Go to page 1' })).toHaveAttribute(
      'href',
      '/jobs?sort=newest',
    )

    await user.click(within(listings).getByRole('link', { name: 'Go to page 2' }))

    expect(router.state.location.search).toBe('?sort=newest&page=2')
    expect(getListedTitles()).toEqual(titles(mockJobs.slice(JOBS_PER_PAGE)))
    expect(getListingsHeading()).toHaveFocus()
  })

  it('offers only page 1 when every result fits on it', () => {
    renderRoute('/jobs?arrangement=remote&page=2')
    const listings = getListings()

    expect(within(listings).getByText(/All the matching jobs fit on page 1\./)).toBeInTheDocument()
    expect(within(listings).getByRole('link', { name: 'Go to page 1' })).toHaveAttribute(
      'href',
      '/jobs?arrangement=remote',
    )
    expect(within(listings).queryByRole('link', { name: /Go to page [2-9]/ })).not.toBeInTheDocument()
  })

  it.each(['0', '-1', 'two', '1.5'])('shows the first page for page=%s', (page) => {
    renderRoute(`/jobs?page=${page}`)

    expect(getResultsSummary()).toHaveTextContent('showing 1–12')
    expect(within(getPagination()).getByRole('link', { name: 'Page 1' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('keeps the page when coming back from a job details page', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/jobs?page=2')
    const job = mockJobs[JOBS_PER_PAGE]

    await user.click(
      screen.getByRole('link', { name: `View details for ${job.title} at ${job.company.name}` }),
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Job Details' })).toBeInTheDocument()

    await act(() => router.navigate(-1))

    expect(getListedTitles()).toEqual(titles(mockJobs.slice(JOBS_PER_PAGE)))
    expect(router.state.location.search).toBe('?page=2')
  })
})
