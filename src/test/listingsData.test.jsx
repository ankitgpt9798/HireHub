import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { mockJobs } from '../data/mockJobs.js'
import { setSimulation } from '../services/jobService.js'
import { sortJobs } from '../utils/sortJobs.js'
import { renderRoute } from './renderRoute.jsx'

// Long enough to see the loading state, short enough for the default `findBy` timeout.
const SLOW = { minDelayMs: 50, maxDelayMs: 50 }

function getListings() {
  return screen.getByRole('region', { name: 'Job listings' })
}

function getResultsSummary() {
  return within(getListings()).getByRole('status')
}

function getListedTitles() {
  return within(getListings())
    .queryAllByRole('article')
    .map((card) => within(card).getByRole('heading', { level: 3 }).textContent)
}

function getFilterPanel() {
  return screen.getByRole('complementary', { name: 'Filters' })
}

function getBusyArea() {
  return getListings().querySelector('[aria-busy]')
}

// The placeholder cards: the cards of the hidden skeleton grid in the results.
function getSkeletonCards() {
  const skeleton = getBusyArea().querySelector(':scope > [aria-hidden="true"]')
  return skeleton ? [...skeleton.firstElementChild.children] : []
}

async function waitForListings() {
  await within(getListings()).findAllByRole('article')
}

describe('job listings from the simulated API', () => {
  it('shows that the listings are loading, then shows them', async () => {
    setSimulation(SLOW)
    await renderRoute('/jobs')

    expect(getResultsSummary()).toHaveTextContent('Loading job listings…')
    expect(getBusyArea()).toHaveAttribute('aria-busy', 'true')
    expect(getListedTitles()).toEqual([])
    expect(getSkeletonCards()).toHaveLength(6)
    // The filter panel shows placeholders, hidden from assistive technology, until it has options.
    expect(within(getFilterPanel()).queryAllByRole('checkbox')).toEqual([])
    expect(getFilterPanel().querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filters' })).toBeDisabled()
    expect(screen.getByRole('combobox', { name: 'Sort by' })).toBeDisabled()
    // Typing a search does not have to wait.
    expect(screen.getByRole('searchbox', { name: 'Search jobs' })).toBeEnabled()

    await waitForListings()

    expect(getResultsSummary()).toHaveTextContent(`${mockJobs.length} listings, showing 1–12`)
    expect(getBusyArea()).toHaveAttribute('aria-busy', 'false')
    expect(getSkeletonCards()).toEqual([])
    expect(within(getFilterPanel()).getByRole('group', { name: 'Work arrangement' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filters' })).toBeEnabled()
    expect(screen.getByRole('combobox', { name: 'Sort by' })).toBeEnabled()
  })

  it('applies the search, filters, and order in the URL once the listings arrive', async () => {
    setSimulation(SLOW)
    const router = await renderRoute('/jobs?q=engineer&skill=aws&sort=salary')
    // The chips are in place before the listings arrive, with the skill as the URL spells it.
    expect(screen.getByRole('button', { name: 'Remove filter: aws' })).toBeInTheDocument()

    await waitForListings()

    // Once the listings arrive, the skill is matched to their spelling.
    expect(screen.getByRole('button', { name: 'Remove filter: AWS' })).toBeInTheDocument()
    const expected = sortJobs(
      mockJobs.filter((job) => /\bengineer/i.test(job.title) && job.skills.includes('AWS')),
      'salary',
    )
    expect(getListedTitles()).toEqual(expected.map((job) => job.title))
    expect(router.state.location.search).toBe('?q=engineer&skill=aws&sort=salary')
  })

  it('explains a failed load and loads the listings again on request', async () => {
    const user = userEvent.setup()
    setSimulation({ mode: 'error' })
    await renderRoute('/jobs')
    const listings = getListings()

    expect(
      within(listings).getByRole('heading', { name: 'The job listings could not be loaded' }),
    ).toBeInTheDocument()
    expect(getResultsSummary()).toHaveTextContent('The job listings could not be loaded.')
    expect(
      within(getFilterPanel()).getByText('Filters are available once the listings load.'),
    ).toBeInTheDocument()

    setSimulation({ mode: 'normal', ...SLOW })
    await user.click(within(listings).getByRole('button', { name: 'Try again' }))

    expect(getResultsSummary()).toHaveTextContent('Loading job listings…')
    expect(screen.getByRole('heading', { name: 'Job listings' })).toHaveFocus()

    await waitForListings()
    expect(getListedTitles()).toHaveLength(12)
  })

  it('fails again if the service is still down', async () => {
    const user = userEvent.setup()
    setSimulation({ mode: 'error' })
    await renderRoute('/jobs')

    await user.click(within(getListings()).getByRole('button', { name: 'Try again' }))

    expect(
      await within(getListings()).findByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument()
    expect(getResultsSummary()).toHaveTextContent('The job listings could not be loaded.')
  })

  it('says when there are no listings, and asks again on Refresh', async () => {
    const user = userEvent.setup()
    setSimulation({ mode: 'empty' })
    await renderRoute('/jobs')
    const listings = getListings()

    expect(within(listings).getByRole('heading', { name: 'No job listings right now' })).toBeInTheDocument()
    expect(getResultsSummary()).toHaveTextContent(/^0 listings$/)
    expect(within(getFilterPanel()).getByText('There are no listings to filter.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filters' })).toBeDisabled()

    setSimulation({ mode: 'normal' })
    await user.click(within(listings).getByRole('button', { name: 'Refresh' }))

    await waitForListings()
    expect(getResultsSummary()).toHaveTextContent(`${mockJobs.length} listings`)
  })

  it('loads the listings once and shares them between pages', async () => {
    const user = userEvent.setup()
    await renderRoute('/jobs')
    // If the listings were requested again, they would now fail.
    setSimulation({ mode: 'error' })
    const nav = screen.getByRole('navigation', { name: 'Primary' })

    await user.click(within(nav).getByRole('link', { name: 'Saved Jobs' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Saved Jobs' })).toBeInTheDocument()
    await user.click(within(nav).getByRole('link', { name: 'Discover Jobs' }))

    expect(getListedTitles()).toHaveLength(12)
    expect(getResultsSummary()).toHaveTextContent(`${mockJobs.length} listings, showing 1–12`)
  })
})
