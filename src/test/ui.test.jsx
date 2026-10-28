import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Star } from 'lucide-react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import MetricCard from '../components/dashboard/MetricCard.jsx'
import EmptyState from '../components/feedback/EmptyState.jsx'
import { Avatar } from '../components/ui/Avatar.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Button, ButtonLink } from '../components/ui/Button.jsx'
import { IconButton } from '../components/ui/IconButton.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { Pagination } from '../components/ui/Pagination.jsx'

describe('Button', () => {
  it('defaults to type="button" and handles clicks', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Apply</Button>)

    const button = screen.getByRole('button', { name: 'Apply' })
    expect(button).toHaveAttribute('type', 'button')
    await user.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not fire clicks when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Apply
      </Button>,
    )

    await user.click(screen.getByRole('button', { name: 'Apply' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('renders ButtonLink as a router link', () => {
    render(
      <MemoryRouter>
        <ButtonLink to="/saved">Saved</ButtonLink>
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Saved' })).toHaveAttribute('href', '/saved')
  })
})

describe('IconButton', () => {
  it('uses the label as its accessible name and hides the icon', () => {
    render(<IconButton icon={Star} label="Favorite" />)
    const button = screen.getByRole('button', { name: 'Favorite' })
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('Avatar', () => {
  it.each([
    ['Guest User', 'GU'],
    ['ada', 'A'],
    ['  Mary  Ann Smith ', 'MA'],
  ])('shows initials for %j', (name, initials) => {
    const { container } = render(<Avatar name={name} />)
    expect(container.firstChild).toHaveTextContent(initials)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('Badge', () => {
  it('renders its content', () => {
    render(<Badge variant="brand">Remote</Badge>)
    expect(screen.getByText('Remote')).toBeInTheDocument()
  })
})

describe('PageHeader', () => {
  it('renders the title, description, and actions and sets the document title', async () => {
    render(<PageHeader title="Reports" description="All reports" actions={<button>Export</button>} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Reports' })).toBeInTheDocument()
    expect(screen.getByText('All reports')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument()
    await waitFor(() => expect(document.title).toBe('Reports · HireHub'))
  })
})

describe('EmptyState', () => {
  it('renders the title at the requested heading level with description and action', () => {
    render(
      <EmptyState
        titleAs="h3"
        title="Nothing here"
        description="Try again later."
        action={<button>Retry</button>}
      />,
    )

    expect(screen.getByRole('heading', { level: 3, name: 'Nothing here' })).toBeInTheDocument()
    expect(screen.getByText('Try again later.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })
})

describe('MetricCard', () => {
  it('shows a no-data state when there is no value', () => {
    render(<MetricCard label="Total jobs" icon={Star} />)
    expect(screen.getByText('No data yet')).toBeInTheDocument()
  })

  it('shows zero as a real value', () => {
    render(<MetricCard label="Saved jobs" value={0} icon={Star} />)
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.queryByText('No data yet')).not.toBeInTheDocument()
  })
})

describe('Pagination', () => {
  function renderPagination(props) {
    const pageLink = (page) => ({ search: `?page=${page}` })
    render(
      <MemoryRouter initialEntries={['/jobs']}>
        <Pagination pageLink={pageLink} {...props} />
      </MemoryRouter>,
    )
    return screen.getByRole('navigation', { name: props.label ?? 'Pagination' })
  }

  function linkNames(nav) {
    return within(nav)
      .getAllByRole('link')
      .map((link) => link.textContent.replace(/\s+/g, ' ').trim())
  }

  it('links to every page of a short list and marks the current one', () => {
    const nav = renderPagination({ page: 2, pageCount: 4, label: 'Result pages' })

    expect(linkNames(nav)).toEqual([
      'Previous page',
      'Page 1',
      'Page 2',
      'Page 3',
      'Page 4',
      'Next page',
    ])
    expect(within(nav).getByRole('link', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Page 3' })).not.toHaveAttribute('aria-current')
    expect(within(nav).getByRole('link', { name: 'Page 3' })).toHaveAttribute('href', '/jobs?page=3')
    expect(within(nav).getByText('Page 2 of 4')).toBeInTheDocument()
  })

  it('links to the previous and next pages', () => {
    const nav = renderPagination({ page: 2, pageCount: 4 })

    const previous = within(nav).getByRole('link', { name: 'Previous page' })
    expect(previous).toHaveAttribute('href', '/jobs?page=1')
    expect(previous).toHaveAttribute('rel', 'prev')
    const next = within(nav).getByRole('link', { name: 'Next page' })
    expect(next).toHaveAttribute('href', '/jobs?page=3')
    expect(next).toHaveAttribute('rel', 'next')
  })

  it('disables Previous on the first page and Next on the last', () => {
    const first = renderPagination({ page: 1, pageCount: 3, label: 'First' })
    expect(within(first).getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(within(first).queryByRole('link', { name: 'Previous page' })).not.toBeInTheDocument()
    expect(within(first).getByRole('link', { name: 'Next page' })).toBeInTheDocument()

    const last = renderPagination({ page: 3, pageCount: 3, label: 'Last' })
    expect(within(last).getByRole('button', { name: 'Next page' })).toBeDisabled()
    expect(within(last).getByRole('link', { name: 'Previous page' })).toBeInTheDocument()
  })

  it('leaves pages out of a long list, keeping the ends and the current page with its neighbours', () => {
    const nav = renderPagination({ page: 6, pageCount: 12 })

    expect(linkNames(nav)).toEqual([
      'Previous page',
      'Page 1',
      'Page 5',
      'Page 6',
      'Page 7',
      'Page 12',
      'Next page',
    ])
    // The gaps are visual only.
    const gaps = within(nav).getAllByText('…')
    expect(gaps).toHaveLength(2)
    for (const gap of gaps) expect(gap).toHaveAttribute('aria-hidden', 'true')
  })

  it('calls onNavigate when a link is followed', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    const nav = renderPagination({ page: 1, pageCount: 3, onNavigate })

    await user.click(within(nav).getByRole('link', { name: 'Page 3' }))
    await user.click(within(nav).getByRole('link', { name: 'Next page' }))

    expect(onNavigate).toHaveBeenCalledTimes(2)
  })
})
