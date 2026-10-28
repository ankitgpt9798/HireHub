import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockJobs } from '../data/mockJobs.js'
import { SEARCH_DEBOUNCE_MS } from '../hooks/useSearchQuery.js'
import { renderRoute } from './renderRoute.jsx'

const REACT_JOB_TITLES = [
  'Senior Frontend Engineer',
  'Frontend Developer',
  'Full Stack Engineer',
  'Junior Web Developer',
]

function setupUser() {
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
}

function getSearchBox() {
  return screen.getByRole('searchbox', { name: 'Search jobs' })
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

async function waitForTypingPause() {
  await act(() => vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS))
}

describe('job search', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Testing Library waits on a setTimeout after each act() and only advances fake timers
    // when it finds a global `jest`, so without this every user-event call hangs.
    vi.stubGlobal('jest', { advanceTimersByTime: (ms) => vi.advanceTimersByTime(ms) })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('shows a labelled search box on the Discover Jobs page', () => {
    renderRoute('/jobs')

    expect(screen.getByRole('search', { name: 'Search jobs' })).toContainElement(getSearchBox())
    expect(getSearchBox()).toHaveValue('')
    expect(getResultsSummary()).toHaveTextContent(`${mockJobs.length} listings`)
  })

  it('updates the results and the URL once typing pauses', async () => {
    const user = setupUser()
    const router = renderRoute('/jobs')

    await user.type(getSearchBox(), 'react')
    expect(getSearchBox()).toHaveValue('react')
    expect(getListedTitles()).toHaveLength(mockJobs.length)

    await waitForTypingPause()
    expect(getListedTitles()).toEqual(REACT_JOB_TITLES)
    expect(getResultsSummary()).toHaveTextContent(`4 of ${mockJobs.length} listings match “react”`)
    expect(router.state.location.search).toBe('?q=react')
    expect(router.state.historyAction).toBe('REPLACE')
  })

  it('keeps typing that continues after the URL has updated', async () => {
    const user = setupUser()
    const router = renderRoute('/jobs')

    await user.type(getSearchBox(), 'reac')
    await waitForTypingPause()
    expect(router.state.location.search).toBe('?q=reac')

    await user.type(getSearchBox(), 't')
    expect(getSearchBox()).toHaveValue('react')

    await waitForTypingPause()
    expect(getSearchBox()).toHaveValue('react')
    expect(router.state.location.search).toBe('?q=react')
  })

  it('searches immediately on Enter', async () => {
    const user = setupUser()
    renderRoute('/jobs')

    await user.type(getSearchBox(), 'harborline{Enter}')

    expect(getListedTitles()).toEqual([
      'Senior Backend Engineer (Go)',
      'Senior Product Manager',
      'Business Intelligence Analyst',
    ])
    expect(getResultsSummary()).toHaveTextContent(`3 of ${mockJobs.length} listings match “harborline”`)
  })

  it('uses singular wording for a single match', async () => {
    const user = setupUser()
    renderRoute('/jobs')

    await user.type(getSearchBox(), 'senior react{Enter}')

    expect(getListedTitles()).toEqual(['Senior Frontend Engineer'])
    expect(getResultsSummary()).toHaveTextContent(
      `1 of ${mockJobs.length} listings matches “senior react”`,
    )
  })

  it('restores a search from the URL', () => {
    renderRoute('/jobs?q=new%20york')

    expect(getSearchBox()).toHaveValue('new york')
    expect(getListedTitles()).toEqual(['Engineering Manager, Payments', 'Senior iOS Engineer'])
  })

  it('clears the search with the clear button and returns focus to the box', async () => {
    const user = setupUser()
    const router = renderRoute('/jobs?q=react')
    expect(getListedTitles()).toEqual(REACT_JOB_TITLES)

    await user.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(getSearchBox()).toHaveValue('')
    expect(getSearchBox()).toHaveFocus()
    expect(getListedTitles()).toHaveLength(mockJobs.length)
    expect(router.state.location.search).toBe('')
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
  })

  it('clears the search with Escape', async () => {
    const user = setupUser()
    renderRoute('/jobs?q=react')

    await user.click(getSearchBox())
    await user.keyboard('{Escape}')

    expect(getSearchBox()).toHaveValue('')
    expect(getListedTitles()).toHaveLength(mockJobs.length)
  })

  it('shows an empty state with a way out when nothing matches', async () => {
    const user = setupUser()
    renderRoute('/jobs')

    await user.type(getSearchBox(), 'zzzz{Enter}')

    const listings = getListings()
    expect(within(listings).queryAllByRole('article')).toHaveLength(0)
    expect(within(listings).getByRole('heading', { name: 'No jobs match your search' })).toBeInTheDocument()
    expect(within(listings).getByText(/Nothing matches “zzzz”/)).toBeInTheDocument()
    expect(getResultsSummary()).toHaveTextContent(`0 of ${mockJobs.length} listings match “zzzz”`)

    await user.click(within(listings).getByRole('button', { name: 'Clear search' }))

    expect(getSearchBox()).toHaveValue('')
    expect(getSearchBox()).toHaveFocus()
    expect(getListedTitles()).toHaveLength(mockJobs.length)
  })

  it('keeps the search when coming back from a job details page', async () => {
    const user = setupUser()
    const router = renderRoute('/jobs?q=react')

    await user.click(
      screen.getByRole('link', { name: 'View details for Frontend Developer at Quillstack' }),
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Job Details' })).toBeInTheDocument()

    await act(() => router.navigate(-1))

    expect(screen.getByRole('heading', { level: 1, name: 'Discover Jobs' })).toBeInTheDocument()
    expect(getSearchBox()).toHaveValue('react')
    expect(getListedTitles()).toEqual(REACT_JOB_TITLES)
  })

  it('follows the URL when a link or back/forward navigation changes the search', async () => {
    const user = setupUser()
    const router = renderRoute('/jobs?q=react')
    const nav = screen.getByRole('navigation', { name: 'Primary' })

    await user.click(within(nav).getByRole('link', { name: 'Discover Jobs' }))
    expect(getSearchBox()).toHaveValue('')
    expect(getListedTitles()).toHaveLength(mockJobs.length)

    await act(() => router.navigate(-1))
    expect(getSearchBox()).toHaveValue('react')
    expect(getListedTitles()).toEqual(REACT_JOB_TITLES)

    // The URL change must not be undone by the box's pending update.
    await waitForTypingPause()
    expect(router.state.location.search).toBe('?q=react')
  })
})
