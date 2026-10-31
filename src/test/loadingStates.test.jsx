import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { mockJobs } from '../data/mockJobs.js'
import { setSimulation } from '../services/jobService.js'
import { renderRoute } from './renderRoute.jsx'

// Requests slow enough to act on the page while they are on their way, with room to spare
// on a slow machine. VERY_SLOW leaves time for several interactions.
const SLOW = { minDelayMs: 600, maxDelayMs: 600 }
const VERY_SLOW = { minDelayMs: 1500, maxDelayMs: 1500 }

function delay(ms) {
  return act(() => new Promise((resolve) => setTimeout(resolve, ms)))
}

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

function getBusyArea() {
  return getListings().querySelector('[aria-busy]')
}

function getRefreshButton() {
  return screen.getByRole('button', { name: 'Refresh listings' })
}

async function waitForSummary(text) {
  await within(getListings()).findByText(text, {}, { timeout: 4000 })
}

describe('loading states', () => {
  it('has the controls and filter chips in place before the listings arrive', async () => {
    setSimulation(SLOW)
    await renderRoute('/jobs?arrangement=remote&type=contract')

    expect(screen.getByRole('button', { name: 'Filters (2 active)' })).toBeDisabled()
    expect(screen.getByRole('combobox', { name: 'Sort by' })).toBeDisabled()
    expect(getRefreshButton()).toBeDisabled()
    expect(within(getListings()).getByRole('list', { name: 'Active filters' })).toBeInTheDocument()

    await waitForSummary(`1 of ${mockJobs.length} listings matches your filters`)
    expect(getRefreshButton()).toBeEnabled()
  })

  it('applies a search typed while the listings load', async () => {
    const user = userEvent.setup()
    setSimulation(SLOW)
    await renderRoute('/jobs')

    await user.type(screen.getByRole('searchbox', { name: 'Search jobs' }), 'react{Enter}')
    expect(getResultsSummary()).toHaveTextContent('Loading job listings…')

    await waitForSummary(`4 of ${mockJobs.length} listings match “react”`)
    expect(getListedTitles()).toHaveLength(4)
  })

  it('applies a filter removed while the listings load', async () => {
    const user = userEvent.setup()
    setSimulation(SLOW)
    const router = await renderRoute('/jobs?arrangement=remote&type=contract')

    await user.click(screen.getByRole('button', { name: 'Remove filter: Contract' }))
    expect(router.state.location.search).toBe('?arrangement=remote')

    await waitForSummary(`9 of ${mockJobs.length} listings match your filters`)
  })

  it('keeps the listings on screen, dimmed and busy, while they refresh', async () => {
    const user = userEvent.setup()
    await renderRoute('/jobs')
    setSimulation(SLOW)

    await user.click(getRefreshButton())

    expect(getResultsSummary()).toHaveTextContent('Refreshing job listings…')
    expect(getListedTitles()).toHaveLength(12)
    expect(getBusyArea()).toHaveAttribute('aria-busy', 'true')
    expect(getBusyArea()).toHaveClass('opacity-60')
    expect(getRefreshButton().querySelector('svg')).toHaveClass('motion-safe:animate-spin')
    // Focus stays on the button, which is still there.
    expect(getRefreshButton()).toHaveFocus()

    await waitForSummary(`${mockJobs.length} listings, showing 1–12`)
    expect(getBusyArea()).toHaveAttribute('aria-busy', 'false')
    expect(getBusyArea()).not.toHaveClass('opacity-60')
    expect(getRefreshButton().querySelector('svg')).not.toHaveClass('motion-safe:animate-spin')
  })

  it('applies filter, sort, and page changes made during a refresh straight away', async () => {
    const user = userEvent.setup()
    const router = await renderRoute('/jobs')
    setSimulation(VERY_SLOW)
    await user.click(getRefreshButton())

    const panel = screen.getByRole('complementary', { name: 'Filters' })
    await user.click(within(panel).getByRole('checkbox', { name: /^Full-time/ }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort by' }), 'Highest salary')
    await user.click(screen.getByRole('link', { name: 'Page 2' }))

    // The listings already on screen are filtered, sorted, and paged without waiting.
    expect(getResultsSummary()).toHaveTextContent('Refreshing job listings…')
    expect(getListedTitles()).toHaveLength(6)
    expect(router.state.location.search).toBe('?type=full-time&sort=salary&page=2')

    // The refreshed listings arrive under the same choices.
    await waitForSummary(`18 of ${mockJobs.length} listings match your filters, showing 13–18`)
    expect(getListedTitles()).toHaveLength(6)
    expect(router.state.location.search).toBe('?type=full-time&sort=salary&page=2')
  })

  it('starts over when Refresh is pressed again and ignores the earlier request', async () => {
    const user = userEvent.setup()
    await renderRoute('/jobs')

    // The first refresh would fail, but only after the second has finished.
    setSimulation({ mode: 'error', minDelayMs: 200, maxDelayMs: 200 })
    await user.click(getRefreshButton())
    setSimulation({ mode: 'normal', minDelayMs: 20, maxDelayMs: 20 })
    await user.click(getRefreshButton())

    await waitForSummary(`${mockJobs.length} listings, showing 1–12`)
    await delay(300)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(getResultsSummary()).toHaveTextContent(`${mockJobs.length} listings, showing 1–12`)
    expect(getBusyArea()).toHaveAttribute('aria-busy', 'false')
  })

  it('keeps the earlier listings and offers to try again when a refresh fails', async () => {
    const user = userEvent.setup()
    await renderRoute('/jobs')
    setSimulation({ mode: 'error' })

    await user.click(getRefreshButton())

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(
      'The listings could not be refreshed, so these are the ones loaded earlier.',
    )
    expect(getListedTitles()).toHaveLength(12)
    expect(getResultsSummary()).toHaveTextContent(`${mockJobs.length} listings, showing 1–12`)
    expect(getBusyArea()).toHaveAttribute('aria-busy', 'false')

    setSimulation({ mode: 'normal' })
    await user.click(within(alert).getByRole('button', { name: 'Try again' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Job listings' })).toHaveFocus()
    expect(getListedTitles()).toHaveLength(12)
  })
})
