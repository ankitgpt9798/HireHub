import { FileQuestion, Info, SearchX, SlidersHorizontal } from 'lucide-react'
import { useCallback, useId, useRef, useState } from 'react'
import EmptyState from '../components/feedback/EmptyState.jsx'
import ActiveFilters from '../components/filters/ActiveFilters.jsx'
import FilterDrawer from '../components/filters/FilterDrawer.jsx'
import FilterPanel from '../components/filters/FilterPanel.jsx'
import SearchBar from '../components/filters/SearchBar.jsx'
import SortSelect from '../components/filters/SortSelect.jsx'
import JobList from '../components/jobs/JobList.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Button, ButtonLink } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { Pagination } from '../components/ui/Pagination.jsx'
import { mockJobs } from '../data/mockJobs.js'
import { useJobFilters } from '../hooks/useJobFilters.js'
import { useResultsPage } from '../hooks/useResultsPage.js'
import { useSearchQuery } from '../hooks/useSearchQuery.js'
import { useSortOrder } from '../hooks/useSortOrder.js'
import {
  EMPTY_FILTERS,
  filterJobs,
  getActiveFilters,
  getFilterCounts,
  getSkillOptions,
  removeFilter,
} from '../utils/filterJobs.js'
import { paginate } from '../utils/pagination.js'
import { searchJobs } from '../utils/searchJobs.js'
import { sortJobs } from '../utils/sortJobs.js'

const SKILL_OPTIONS = getSkillOptions(mockJobs)

// Fills whole rows in the one-, two-, and three-column layouts of the job list.
const JOBS_PER_PAGE = 12

// "24 listings", or "3 of 24 listings match “react” and your filters" while searching or filtering.
function resultsSummary(count, total, query, isFiltered) {
  if (!query && !isFiltered) return `${total} listings`
  const criteria = [query && `“${query}”`, isFiltered && 'your filters'].filter(Boolean).join(' and ')
  return `${count} of ${total} listings ${count === 1 ? 'matches' : 'match'} ${criteria}`
}

// For a page number past the end of the results, such as an old link to page 3 after the
// listings have changed.
function PageOutOfRange({ page, pageCount, pageLink, onNavigate }) {
  const description =
    pageCount === 1
      ? 'All the matching jobs fit on page 1. The link you followed may be out of date.'
      : `The results end on page ${pageCount}. The link you followed may be out of date.`

  return (
    <Card>
      <EmptyState
        icon={FileQuestion}
        titleAs="h3"
        title={`There are no jobs on page ${page}`}
        description={description}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <ButtonLink to={pageLink(1)} variant="secondary" onClick={onNavigate}>
              Go to page 1
            </ButtonLink>
            {pageCount > 1 && (
              <ButtonLink to={pageLink(pageCount)} variant="secondary" onClick={onNavigate}>
                Go to page {pageCount}
              </ButtonLink>
            )}
          </div>
        }
      />
    </Card>
  )
}

function NoResults({ query, isFiltered, onClearSearch, onClearFilters }) {
  let title = 'No jobs match your search'
  let description = `Nothing matches “${query}”. Check the spelling, or try a broader term such as a skill, company, or city.`
  if (query && isFiltered) {
    title = 'No jobs match your search and filters'
    description = `Nothing matches “${query}” with the filters you chose. Try a broader search or remove a filter.`
  } else if (isFiltered) {
    title = 'No jobs match your filters'
    description = 'Try removing a filter or two, or clear them all to see every listing.'
  }

  return (
    <Card>
      <EmptyState
        icon={SearchX}
        titleAs="h3"
        title={title}
        description={description}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {isFiltered && (
              <Button variant="secondary" onClick={onClearFilters}>
                Clear filters
              </Button>
            )}
            {query && (
              <Button variant="secondary" onClick={onClearSearch}>
                Clear search
              </Button>
            )}
          </div>
        }
      />
    </Card>
  )
}

export default function DiscoverJobsPage() {
  const { query, input, setInput, applyInput } = useSearchQuery()
  const [filters, updateFilters] = useJobFilters(SKILL_OPTIONS)
  const [sort, setSort] = useSortOrder()
  const [page, pageLink] = useResultsPage()
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const closeFilterDrawer = useCallback(() => setFilterDrawerOpen(false), [])
  const searchInputRef = useRef(null)
  const listingsHeadingRef = useRef(null)
  const filtersHeadingId = useId()

  const searchedJobs = searchJobs(mockJobs, query)
  const jobs = filterJobs(searchedJobs, filters)
  const sortedJobs = sortJobs(jobs, sort, { query, skills: filters.skills })
  const { items: pageJobs, pageCount, firstItem, lastItem } = paginate(
    sortedJobs,
    page,
    JOBS_PER_PAGE,
  )
  const activeFilters = getActiveFilters(filters)
  const isFiltered = activeFilters.length > 0
  const panelProps = {
    filters,
    counts: getFilterCounts(searchedJobs, filters),
    skillOptions: SKILL_OPTIONS,
    onChange: updateFilters,
  }

  function clearSearch() {
    applyInput('')
    searchInputRef.current.focus()
  }

  function clearFilters() {
    updateFilters(() => EMPTY_FILTERS)
  }

  // For controls that disappear once the filters are cleared.
  function clearFiltersAndFocusResults() {
    clearFilters()
    listingsHeadingRef.current.focus()
  }

  // After following a page link, start reading the new page from the top of the results.
  function showTopOfResults() {
    const heading = listingsHeadingRef.current
    heading.focus({ preventScroll: true })
    heading.scrollIntoView({ block: 'start' })
  }

  let results
  if (jobs.length === 0) {
    results = (
      <NoResults
        query={query}
        isFiltered={isFiltered}
        onClearSearch={clearSearch}
        onClearFilters={clearFiltersAndFocusResults}
      />
    )
  } else if (pageJobs.length === 0) {
    results = (
      <PageOutOfRange
        page={page}
        pageCount={pageCount}
        pageLink={pageLink}
        onNavigate={showTopOfResults}
      />
    )
  } else {
    results = (
      <>
        <JobList jobs={pageJobs} />
        {pageCount > 1 && (
          <Pagination
            label="Job listing pages"
            page={page}
            pageCount={pageCount}
            pageLink={pageLink}
            onNavigate={showTopOfResults}
          />
        )}
      </>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discover Jobs"
        description="Browse sample job listings across engineering, design, data, and product."
      />

      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <SearchBar
            ref={searchInputRef}
            label="Search jobs"
            placeholder="Search by title, company, location, or skill"
            value={input}
            onChange={setInput}
            onSearch={applyInput}
            onClear={clearSearch}
          />
        </div>
        <Button
          variant="secondary"
          size="lg"
          aria-haspopup="dialog"
          onClick={() => setFilterDrawerOpen(true)}
          className="xl:hidden"
        >
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          {/* Icon-only on phones, to leave the search box room. */}
          <span className="sr-only sm:not-sr-only">Filters</span>
          {isFiltered && (
            <>
              {' '}
              <span className="sr-only">({activeFilters.length} active)</span>
              <span
                aria-hidden="true"
                className="rounded-full bg-brand-600 px-1.5 text-xs leading-5 font-semibold text-white"
              >
                {activeFilters.length}
              </span>
            </>
          )}
        </Button>
      </div>

      <div className="xl:grid xl:grid-cols-[15rem_minmax(0,1fr)] xl:items-start xl:gap-6">
        <Card as="aside" aria-labelledby={filtersHeadingId} className="hidden xl:block">
          <div className="flex h-14 items-center justify-between gap-2 border-b border-slate-200 px-4">
            <h2 id={filtersHeadingId} className="text-base font-semibold text-slate-900">
              Filters
            </h2>
            {isFiltered && (
              <Button variant="ghost" size="sm" onClick={clearFiltersAndFocusResults}>
                Clear all
              </Button>
            )}
          </div>
          <FilterPanel {...panelProps} />
        </Card>

        <section aria-labelledby="job-listings-heading" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
            <div>
              {/* Focus lands here when the filter controls someone was using disappear, and
                  after moving to another page. The scroll margin clears the sticky top bar. */}
              <h2
                ref={listingsHeadingRef}
                id="job-listings-heading"
                tabIndex={-1}
                className="scroll-mt-24 text-base font-semibold text-slate-900 focus:outline-none"
              >
                Job listings
              </h2>
              {/* A live region, so screen readers announce the new count after each change. */}
              <p role="status" className="text-sm text-slate-600">
                {resultsSummary(jobs.length, mockJobs.length, query, isFiltered)}
                {pageCount > 1 && pageJobs.length > 0 && `, showing ${firstItem}–${lastItem}`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Badge variant="warning">
                <Info aria-hidden="true" className="size-3.5" />
                Sample data, not live postings
              </Badge>
              <SortSelect value={sort} onChange={setSort} />
            </div>
          </div>

          {isFiltered && (
            <ActiveFilters
              activeFilters={activeFilters}
              onRemove={(filter) => updateFilters((current) => removeFilter(current, filter))}
              onClearAll={clearFilters}
              fallbackFocusRef={listingsHeadingRef}
            />
          )}

          {results}
        </section>
      </div>

      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        resultCount={jobs.length}
        isFiltered={isFiltered}
        onClearAll={clearFilters}
        {...panelProps}
      />
    </div>
  )
}
