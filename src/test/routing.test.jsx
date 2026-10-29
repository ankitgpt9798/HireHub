import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderRoute } from './renderRoute.jsx'

function getPageHeading(name) {
  return screen.getByRole('heading', { level: 1, name })
}

describe('app routing', () => {
  it.each([
    ['/', 'Dashboard'],
    ['/jobs', 'Discover Jobs'],
    ['/saved', 'Saved Jobs'],
  ])('renders the page for %s', async (path, heading) => {
    await renderRoute(path)
    expect(getPageHeading(heading)).toBeInTheDocument()
  })

  it.each([
    ['/', 'Dashboard · HireHub'],
    ['/saved', 'Saved Jobs · HireHub'],
    ['/does-not-exist', 'Page not found · HireHub'],
  ])('sets the document title for %s', async (path, title) => {
    await renderRoute(path)
    await waitFor(() => expect(document.title).toBe(title))
  })

  it('passes the job id to the job details page', async () => {
    await renderRoute('/jobs/job-42')
    expect(getPageHeading('Job Details')).toBeInTheDocument()
    expect(screen.getByText('job-42')).toBeInTheDocument()
  })

  it('links from job details back to the job list', async () => {
    const user = userEvent.setup()
    await renderRoute('/jobs/job-42')

    await user.click(screen.getByRole('link', { name: 'Back to jobs' }))
    expect(getPageHeading('Discover Jobs')).toBeInTheDocument()
  })

  it('renders the not-found page for unknown routes with a way back', async () => {
    const user = userEvent.setup()
    await renderRoute('/does-not-exist')
    expect(getPageHeading('Page not found')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Back to dashboard' }))
    expect(getPageHeading('Dashboard')).toBeInTheDocument()
  })

  it('navigates with the primary nav and marks the active link', async () => {
    const user = userEvent.setup()
    await renderRoute('/')
    const nav = screen.getByRole('navigation', { name: 'Primary' })

    expect(within(nav).getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page')

    await user.click(within(nav).getByRole('link', { name: 'Saved Jobs' }))
    expect(getPageHeading('Saved Jobs')).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Saved Jobs' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current')
  })

  it('marks only the active primary nav link as the current page', async () => {
    await renderRoute('/')
    const currentLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page')
    expect(currentLinks).toHaveLength(1)
    expect(currentLinks[0]).toHaveTextContent('Dashboard')
  })

  it('keeps Discover Jobs active on a job details route', async () => {
    await renderRoute('/jobs/job-42')
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(nav).getByRole('link', { name: 'Discover Jobs' })).toHaveAttribute('aria-current', 'page')
  })

  it('provides a skip link to the main content', async () => {
    await renderRoute('/')
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute('href', '#main-content')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
  })
})
