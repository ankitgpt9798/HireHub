import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import CompanyLogo from '../components/jobs/CompanyLogo.jsx'
import JobCard from '../components/jobs/JobCard.jsx'
import { mockJobs } from '../data/mockJobs.js'
import { renderRoute } from './renderRoute.jsx'

const DAY_MS = 24 * 60 * 60 * 1000

const job = {
  id: 'job-test',
  title: 'Platform Engineer',
  company: { id: 'acme', name: 'Acme Widgets' },
  location: 'Remote (US)',
  workArrangement: 'remote',
  employmentType: 'contract',
  experienceLevel: 'senior',
  salary: { min: 90, max: 110, currency: 'USD', period: 'hour' },
  skills: ['Go', 'Kubernetes', 'Terraform'],
  postedAt: new Date(Date.now() - 2 * DAY_MS).toISOString(),
}

function renderCard(overrides = {}) {
  render(
    <MemoryRouter>
      <JobCard job={{ ...job, ...overrides }} />
    </MemoryRouter>,
  )
  return screen.getByRole('article', { name: 'Platform Engineer' })
}

describe('JobCard', () => {
  it('shows the role, company, and job type', () => {
    const card = renderCard()

    expect(within(card).getByRole('heading', { level: 3, name: 'Platform Engineer' })).toBeInTheDocument()
    expect(within(card).getByText('Acme Widgets')).toBeInTheDocument()
    expect(within(card).getByText('Remote')).toBeInTheDocument()
    expect(within(card).getByText('Contract')).toBeInTheDocument()
    expect(within(card).getByText('Senior level')).toBeInTheDocument()
  })

  it('labels the location and salary for screen readers', () => {
    const card = renderCard()

    expect(within(card).getByText('Location')).toHaveClass('sr-only')
    expect(within(card).getByText('Remote (US)')).toBeInTheDocument()
    expect(within(card).getByText('Salary')).toHaveClass('sr-only')
    expect(within(card).getByText('$90–$110 per hour')).toBeInTheDocument()
  })

  it('says when a salary is not listed', () => {
    const card = renderCard({ salary: null })
    expect(within(card).getByText('Salary not listed')).toBeInTheDocument()
  })

  it('lists the required skills', () => {
    const card = renderCard()
    const skills = within(card).getByRole('list', { name: 'Skills' })

    expect(within(skills).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Go',
      'Kubernetes',
      'Terraform',
    ])
  })

  it('shows when the job was posted with a machine-readable date', () => {
    const card = renderCard()
    const time = within(card).getByText('2 days ago')

    expect(time.tagName).toBe('TIME')
    expect(time).toHaveAttribute('datetime', job.postedAt)
  })

  it('links to the job details page with a descriptive accessible name', () => {
    const card = renderCard()

    expect(
      within(card).getByRole('link', { name: 'View details for Platform Engineer at Acme Widgets' }),
    ).toHaveAttribute('href', '/jobs/job-test')
  })
})

describe('CompanyLogo', () => {
  it('shows decorative initials for the company', () => {
    const { container } = render(<CompanyLogo name="Acme Widgets" />)
    expect(container.firstChild).toHaveTextContent('AW')
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('Discover Jobs page', () => {
  it('renders cards for the newest sample listings, a page at a time', () => {
    renderRoute('/jobs')
    const listings = screen.getByRole('region', { name: 'Job listings' })
    const firstPage = mockJobs.slice(0, 12)

    expect(within(listings).getAllByRole('article')).toHaveLength(firstPage.length)
    expect(
      within(listings).getByText(`${mockJobs.length} listings, showing 1–12`),
    ).toBeInTheDocument()
    for (const { title } of firstPage) {
      expect(within(listings).getByRole('article', { name: title })).toBeInTheDocument()
    }
  })

  it('labels the listings as sample data', () => {
    renderRoute('/jobs')
    expect(screen.getByText('Sample data, not live postings')).toBeInTheDocument()
  })

  it("opens a job's details page from its card", async () => {
    const user = userEvent.setup()
    const [firstJob] = mockJobs
    renderRoute('/jobs')

    await user.click(
      screen.getByRole('link', {
        name: `View details for ${firstJob.title} at ${firstJob.company.name}`,
      }),
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Job Details' })).toBeInTheDocument()
    expect(screen.getByText(firstJob.id)).toBeInTheDocument()
  })
})
