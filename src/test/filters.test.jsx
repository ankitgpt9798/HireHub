import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { mockJobs } from '../data/mockJobs.js'
import { renderRoute } from './renderRoute.jsx'

const REMOTE_JOB_COUNT = 9

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// A filter checkbox or radio by its label; option names end with a job count ("Remote 9 jobs").
function getOption(container, label, role = 'checkbox') {
  return within(container).getByRole(role, {
    name: new RegExp(`^${escapeRegExp(label)}( \\d+ jobs?)?$`),
  })
}

function getFilterPanel() {
  return screen.getByRole('complementary', { name: 'Filters' })
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

// As on the Discover Jobs page.
const JOBS_PER_PAGE = 12

// Nothing rules a listing out, so the results are the first page of every listing.
function expectEveryListing() {
  expect(getResultsSummary()).toHaveTextContent(
    new RegExp(`^${mockJobs.length} listings, showing 1–${JOBS_PER_PAGE}$`),
  )
  expect(getListedTitles()).toHaveLength(JOBS_PER_PAGE)
}

function getChipNames() {
  const chips = within(getListings()).queryByRole('list', { name: 'Active filters' })
  return chips ? within(chips).getAllByRole('button').map((chip) => chip.textContent) : []
}

function getChip(label) {
  return within(getListings()).getByRole('button', { name: `Remove filter: ${label}` })
}

describe('job filters', () => {
  it('shows each filter group with the number of jobs for each option', () => {
    renderRoute('/jobs')
    const panel = getFilterPanel()

    expect(within(panel).getByRole('group', { name: 'Work arrangement' })).toBeInTheDocument()
    expect(within(panel).getByRole('checkbox', { name: 'Remote 9 jobs' })).not.toBeChecked()
    expect(within(panel).getByRole('checkbox', { name: 'Full-time 18 jobs' })).toBeInTheDocument()
    expect(within(panel).getByRole('checkbox', { name: 'Lead 2 jobs' })).toBeInTheDocument()
    expect(getOption(panel, 'Any salary', 'radio')).toBeChecked()
    expect(getOption(panel, 'Any time', 'radio')).toBeChecked()

    const skills = within(panel).getByRole('group', { name: 'Skills' })
    // The most common skills, before "Show all".
    expect(within(skills).getAllByRole('checkbox').map((box) => box.labels[0].textContent)).toEqual([
      'AWS 7 jobs',
      'Python 6 jobs',
      'SQL 6 jobs',
      'Linux 5 jobs',
      'React 4 jobs',
      'JavaScript 3 jobs',
      'TypeScript 3 jobs',
      'User Research 3 jobs',
      'Accessibility 2 jobs',
      'Agile 2 jobs',
    ])
    expect(screen.queryByRole('list', { name: 'Active filters' })).not.toBeInTheDocument()
  })

  it('filters by a choice and updates the count, the chips, and the URL', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/jobs')

    await user.click(getOption(getFilterPanel(), 'Remote'))

    expect(getOption(getFilterPanel(), 'Remote')).toBeChecked()
    expect(getListedTitles()).toHaveLength(REMOTE_JOB_COUNT)
    expect(getResultsSummary()).toHaveTextContent(
      `${REMOTE_JOB_COUNT} of ${mockJobs.length} listings match your filters`,
    )
    expect(getChipNames()).toEqual(['Remove filter: Remote'])
    expect(router.state.location.search).toBe('?arrangement=remote')
    expect(router.state.historyAction).toBe('REPLACE')
  })

  it('combines choices with OR within a group and AND across groups', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/jobs')

    await user.click(getOption(getFilterPanel(), 'Remote'))
    await user.click(getOption(getFilterPanel(), 'Hybrid'))
    expect(getResultsSummary()).toHaveTextContent(
      `18 of ${mockJobs.length} listings match your filters, showing 1–${JOBS_PER_PAGE}`,
    )

    await user.click(getOption(getFilterPanel(), 'Contract'))
    expect(getListedTitles()).toEqual(['Frontend Developer', 'Android Engineer'])
    expect(router.state.location.search).toBe('?arrangement=remote&arrangement=hybrid&type=contract')
  })

  it('requires every chosen skill by default, or any of them on request', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/jobs')
    const skills = within(getFilterPanel()).getByRole('group', { name: 'Skills' })
    expect(within(skills).queryByRole('group', { name: 'Show jobs that list' })).not.toBeInTheDocument()

    await user.click(getOption(skills, 'React'))
    await user.click(getOption(skills, 'TypeScript'))
    expect(getListedTitles()).toEqual(['Senior Frontend Engineer', 'Full Stack Engineer'])

    const matching = within(skills).getByRole('group', { name: 'Show jobs that list' })
    expect(within(matching).getByRole('radio', { name: 'All selected skills' })).toBeChecked()

    await user.click(within(matching).getByRole('radio', { name: 'Any selected skill' }))
    // Sorted by relevance: jobs that list both skills come first.
    expect(getListedTitles()).toEqual([
      'Senior Frontend Engineer',
      'Full Stack Engineer',
      'Frontend Developer',
      'QA Automation Engineer',
      'Junior Web Developer',
    ])
    expect(router.state.location.search).toBe('?skill=React&skill=TypeScript&match=any')
  })

  it('filters by minimum salary, counting hourly pay as full-time yearly pay', async () => {
    const user = userEvent.setup()
    renderRoute('/jobs')

    await user.click(getOption(getFilterPanel(), '$150K+', 'radio'))

    expect(getListedTitles()).toEqual([
      'Senior Frontend Engineer',
      'DevOps Engineer',
      'Senior Backend Engineer (Go)',
      // $85 an hour, about $177K a year.
      'Frontend Developer',
      'Machine Learning Engineer',
      'Engineering Manager, Payments',
      'Senior iOS Engineer',
      'Senior Product Manager',
      'Android Engineer',
      // Up to exactly $150K.
      'Data Engineer',
      'Senior Embedded Software Engineer',
    ])
    expect(getChipNames()).toEqual(['Remove filter: $150K+ per year'])
  })

  it('filters by date posted', async () => {
    const user = userEvent.setup()
    renderRoute('/jobs')
    const option = getOption(getFilterPanel(), 'Past 3 days', 'radio')
    expect(option).toHaveAccessibleName('Past 3 days 6 jobs')

    await user.click(option)

    expect(getListedTitles()).toEqual([
      'Senior Frontend Engineer',
      'Data Analyst',
      'DevOps Engineer',
      'Product Designer',
      'Senior Backend Engineer (Go)',
      'Frontend Developer',
    ])
    expect(getOption(getFilterPanel(), 'Any time', 'radio')).not.toBeChecked()
  })

  it('removes one filter with its chip, keeping the others and moving focus along the chips', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/jobs?arrangement=remote&type=full-time&skill=AWS')
    expect(getChipNames()).toEqual([
      'Remove filter: Remote',
      'Remove filter: Full-time',
      'Remove filter: AWS',
    ])

    await user.click(getChip('Full-time'))
    expect(getChipNames()).toEqual(['Remove filter: Remote', 'Remove filter: AWS'])
    expect(getChip('AWS')).toHaveFocus()
    expect(getOption(getFilterPanel(), 'Full-time')).not.toBeChecked()
    expect(getListedTitles()).toEqual([
      'Full Stack Engineer',
      'Site Reliability Engineer',
      'Data Engineer',
      'Principal Security Engineer',
    ])
    expect(router.state.location.search).toBe('?arrangement=remote&skill=AWS')

    await user.click(getChip('AWS'))
    expect(getChip('Remote')).toHaveFocus()

    await user.click(getChip('Remote'))
    expect(getChipNames()).toEqual([])
    expect(screen.getByRole('heading', { name: 'Job listings' })).toHaveFocus()
    expectEveryListing()
  })

  it('clears every filter with "Clear all" and moves focus to the results', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/jobs?q=engineer&level=senior&salary=100000&match=any')

    await user.click(within(getListings()).getByRole('button', { name: 'Clear all' }))

    expect(router.state.location.search).toBe('?q=engineer')
    expect(getChipNames()).toEqual([])
    expect(getOption(getFilterPanel(), 'Senior level')).not.toBeChecked()
    expect(getOption(getFilterPanel(), 'Any salary', 'radio')).toBeChecked()
    expect(screen.getByRole('heading', { name: 'Job listings' })).toHaveFocus()
  })

  it('clears every filter from the filter panel too', async () => {
    const user = userEvent.setup()
    renderRoute('/jobs?posted=7')
    const panel = getFilterPanel()

    await user.click(within(panel).getByRole('button', { name: 'Clear all' }))

    expect(getOption(panel, 'Any time', 'radio')).toBeChecked()
    expect(within(panel).queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Job listings' })).toHaveFocus()
  })

  it('combines filters with the search and counts options within the search results', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/jobs?q=react')
    const panel = getFilterPanel()
    expect(within(panel).getByRole('checkbox', { name: 'Remote 3 jobs' })).toBeInTheDocument()
    expect(within(panel).getByRole('checkbox', { name: 'On-site 1 job' })).toBeInTheDocument()
    expect(within(panel).getByRole('checkbox', { name: 'Hybrid 0 jobs' })).toBeInTheDocument()

    await user.click(getOption(panel, 'Remote'))

    expect(getListedTitles()).toEqual([
      'Senior Frontend Engineer',
      'Frontend Developer',
      'Full Stack Engineer',
    ])
    expect(getResultsSummary()).toHaveTextContent(
      `3 of ${mockJobs.length} listings match “react” and your filters`,
    )
    expect(router.state.location.search).toBe('?q=react&arrangement=remote')
  })

  it('restores filters from the URL and ignores values it does not offer', () => {
    renderRoute('/jobs?arrangement=remote&arrangement=moon&skill=react&salary=123&posted=7')
    const panel = getFilterPanel()

    expect(getOption(panel, 'Remote')).toBeChecked()
    expect(getOption(panel, 'React')).toBeChecked()
    expect(getOption(panel, 'Past week', 'radio')).toBeChecked()
    expect(getOption(panel, 'Any salary', 'radio')).toBeChecked()
    expect(getChipNames()).toEqual([
      'Remove filter: Remote',
      'Remove filter: Past week',
      'Remove filter: React',
    ])
    expect(getListedTitles()).toEqual(['Senior Frontend Engineer', 'Frontend Developer'])
  })

  it('shows an empty state with a way out when no job matches the filters', async () => {
    const user = userEvent.setup()
    renderRoute('/jobs?type=internship&level=lead')
    const listings = getListings()

    expect(within(listings).getByRole('heading', { name: 'No jobs match your filters' })).toBeInTheDocument()
    expect(getResultsSummary()).toHaveTextContent(`0 of ${mockJobs.length} listings match your filters`)
    expect(within(listings).queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()

    await user.click(within(listings).getByRole('button', { name: 'Clear filters' }))

    expectEveryListing()
    expect(screen.getByRole('heading', { name: 'Job listings' })).toHaveFocus()
  })

  it('offers to clear the search or the filters when both rule out every job', async () => {
    const user = userEvent.setup()
    renderRoute('/jobs?q=react&type=internship')
    const listings = getListings()

    expect(
      within(listings).getByRole('heading', { name: 'No jobs match your search and filters' }),
    ).toBeInTheDocument()
    expect(within(listings).getByRole('button', { name: 'Clear filters' })).toBeInTheDocument()

    await user.click(within(listings).getByRole('button', { name: 'Clear search' }))

    expect(getListedTitles()).toEqual(['Software Engineering Intern', 'UX Research Intern'])
  })

  it('finds a skill by name and can show every skill', async () => {
    const user = userEvent.setup()
    renderRoute('/jobs')
    const skills = within(getFilterPanel()).getByRole('group', { name: 'Skills' })
    const finder = within(skills).getByRole('searchbox', { name: 'Find a skill' })

    await user.type(finder, 'kot')
    expect(within(skills).getAllByRole('checkbox')).toHaveLength(1)
    await user.click(getOption(skills, 'Kotlin'))
    expect(getListedTitles()).toEqual(['Android Engineer'])

    await user.clear(finder)
    await user.type(finder, 'zzz')
    expect(within(skills).getByText('No skills match “zzz”.')).toBeInTheDocument()

    // With the box empty again, the chosen skill stays in view after the popular ones.
    await user.clear(finder)
    const visible = within(skills).getAllByRole('checkbox')
    expect(visible).toHaveLength(11)
    expect(visible.at(-1)).toHaveAccessibleName('Kotlin 1 job')

    const showAll = within(skills).getByRole('button', { name: 'Show all 68 skills' })
    expect(showAll).toHaveAttribute('aria-expanded', 'false')
    await user.click(showAll)
    expect(within(skills).getAllByRole('checkbox')).toHaveLength(68)
    expect(within(skills).getByRole('button', { name: 'Show fewer skills' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('keeps the filters when coming back from a job details page', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/jobs')

    await user.click(getOption(getFilterPanel(), 'Remote'))
    await user.click(
      screen.getByRole('link', { name: 'View details for Frontend Developer at Quillstack' }),
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Job Details' })).toBeInTheDocument()

    await act(() => router.navigate(-1))

    expect(getOption(getFilterPanel(), 'Remote')).toBeChecked()
    expect(getListedTitles()).toHaveLength(REMOTE_JOB_COUNT)
  })
})

describe('filters drawer', () => {
  function getDrawer() {
    return screen.getByRole('dialog', { name: 'Filters' })
  }

  it('opens from the Filters button, applies filters straight away, and closes', async () => {
    const user = userEvent.setup()
    renderRoute('/jobs')
    const button = screen.getByRole('button', { name: 'Filters' })
    expect(button).toHaveAttribute('aria-haspopup', 'dialog')
    expect(screen.queryByRole('dialog', { name: 'Filters' })).not.toBeInTheDocument()

    await user.click(button)
    await user.click(getOption(getDrawer(), 'Remote'))

    expect(getListedTitles()).toHaveLength(REMOTE_JOB_COUNT)
    expect(screen.getByRole('button', { name: 'Filters (1 active)' })).toBeInTheDocument()

    await user.click(within(getDrawer()).getByRole('button', { name: `Show ${REMOTE_JOB_COUNT} jobs` }))

    expect(screen.queryByRole('dialog', { name: 'Filters' })).not.toBeInTheDocument()
    expect(getChipNames()).toEqual(['Remove filter: Remote'])
  })

  it('clears filters from the drawer and keeps focus inside it', async () => {
    const user = userEvent.setup()
    renderRoute('/jobs?arrangement=remote&type=contract')

    await user.click(screen.getByRole('button', { name: 'Filters (2 active)' }))
    await user.click(within(getDrawer()).getByRole('button', { name: 'Clear all' }))

    const showAll = within(getDrawer()).getByRole('button', { name: `Show ${mockJobs.length} jobs` })
    expect(showAll).toHaveFocus()
    expect(within(getDrawer()).queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument()
  })

  it('uses singular wording for one job and closes with its close button', async () => {
    const user = userEvent.setup()
    renderRoute('/jobs?skill=Kotlin')

    await user.click(screen.getByRole('button', { name: 'Filters (1 active)' }))
    expect(within(getDrawer()).getByRole('button', { name: 'Show 1 job' })).toBeInTheDocument()

    await user.click(within(getDrawer()).getByRole('button', { name: 'Close filters' }))
    expect(screen.queryByRole('dialog', { name: 'Filters' })).not.toBeInTheDocument()
  })
})
