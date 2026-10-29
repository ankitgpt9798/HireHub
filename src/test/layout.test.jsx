import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderRoute } from './renderRoute.jsx'

function queryMobileNav() {
  return screen.queryByRole('dialog', { name: 'Navigation menu' })
}

async function openMobileNav(user) {
  await user.click(screen.getByRole('button', { name: 'Open navigation menu' }))
  return screen.getByRole('dialog', { name: 'Navigation menu' })
}

describe('app shell', () => {
  it('shows the brand, demo-data notice, and demo user', async () => {
    await renderRoute('/')
    expect(screen.getAllByRole('link', { name: 'HireHub' }).length).toBeGreaterThan(0)
    expect(screen.getByText('Demo data')).toBeInTheDocument()
    expect(screen.getByText(/sample data for demonstration/i)).toBeInTheDocument()
    expect(screen.getByText('Guest User')).toBeInTheDocument()
  })

  it('does not show hardcoded dashboard metrics', async () => {
    await renderRoute('/')
    const overview = screen.getByRole('region', { name: 'Overview' })
    expect(within(overview).getAllByText('No data yet')).toHaveLength(4)
  })
})

describe('mobile navigation', () => {
  it('is closed initially', async () => {
    await renderRoute('/')
    expect(queryMobileNav()).not.toBeInTheDocument()
  })

  it('opens and navigates, closing after a link is chosen', async () => {
    const user = userEvent.setup()
    await renderRoute('/')
    const dialog = await openMobileNav(user)

    await user.click(within(dialog).getByRole('link', { name: 'Saved Jobs' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Saved Jobs' })).toBeInTheDocument()
    expect(queryMobileNav()).not.toBeInTheDocument()
  })

  it('closes when the link for the current page is chosen', async () => {
    const user = userEvent.setup()
    await renderRoute('/')
    const dialog = await openMobileNav(user)

    await user.click(within(dialog).getByRole('link', { name: 'Dashboard' }))
    expect(queryMobileNav()).not.toBeInTheDocument()
  })

  it('closes with the close button', async () => {
    const user = userEvent.setup()
    await renderRoute('/')
    const dialog = await openMobileNav(user)

    await user.click(within(dialog).getByRole('button', { name: 'Close navigation menu' }))
    expect(queryMobileNav()).not.toBeInTheDocument()
  })

  it('closes on Escape (the dialog cancel event)', async () => {
    const user = userEvent.setup()
    await renderRoute('/')
    const dialog = await openMobileNav(user)

    fireEvent(dialog, new Event('cancel', { cancelable: true }))
    expect(queryMobileNav()).not.toBeInTheDocument()
  })

  it('closes when the backdrop is clicked but not when the menu content is clicked', async () => {
    const user = userEvent.setup()
    await renderRoute('/')
    const dialog = await openMobileNav(user)

    await user.click(within(dialog).getByText('Demo data'))
    expect(queryMobileNav()).toBeInTheDocument()

    await user.click(dialog)
    expect(queryMobileNav()).not.toBeInTheDocument()
  })
})

describe('notifications panel', () => {
  it('toggles open and closed from its button', async () => {
    const user = userEvent.setup()
    await renderRoute('/')
    const button = screen.getByRole('button', { name: 'Notifications' })
    expect(button).toHaveAttribute('aria-expanded', 'false')

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    const panel = screen.getByRole('region', { name: 'Notifications' })
    expect(button).toHaveAttribute('aria-controls', panel.id)
    expect(within(panel).getByText('You have no new notifications.')).toBeInTheDocument()

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('region', { name: 'Notifications' })).not.toBeInTheDocument()
  })

  it('closes on Escape and returns focus to the button', async () => {
    const user = userEvent.setup()
    await renderRoute('/')
    const button = screen.getByRole('button', { name: 'Notifications' })

    await user.click(button)
    // Clicking the panel's text moves focus off the button.
    await user.click(screen.getByText('You have no new notifications.'))
    expect(button).not.toHaveFocus()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('region', { name: 'Notifications' })).not.toBeInTheDocument()
    expect(button).toHaveFocus()
  })

  it('stays open when clicked inside and closes when clicking elsewhere', async () => {
    const user = userEvent.setup()
    await renderRoute('/')

    await user.click(screen.getByRole('button', { name: 'Notifications' }))
    await user.click(screen.getByText('You have no new notifications.'))
    expect(screen.getByRole('region', { name: 'Notifications' })).toBeInTheDocument()

    await user.click(screen.getByRole('heading', { level: 1, name: 'Dashboard' }))
    expect(screen.queryByRole('region', { name: 'Notifications' })).not.toBeInTheDocument()
  })
})
