import { Info, SearchX, SlidersHorizontal } from 'lucide-react'
import { useCallback, useId, useRef, useState } from 'react'
import EmptyState from '../components/feedback/EmptyState.jsx'
import ActiveFilters from '../components/filters/ActiveFilters.jsx'
import FilterDrawer from '../components/filters/FilterDrawer.jsx'
import FilterPanel from '../components/filters/FilterPanel.jsx'
import SearchBar from '../components/filters/SearchBar.jsx'
import JobList from '../components/jobs/JobList.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { mockJobs } from '../data/mockJobs.js'
import { useJobFilters } from '../hooks/useJobFilters.js'
import { useSearchQuery } from '../hooks/useSearchQuery.js'
import {
  EMPTY_FILTERS,
  filterJobs,
  getActiveFilters,
  getFilterCounts,
  getSkillOptions,
  removeFilter,
} from '../utils/filterJobs.js'
import { searchJobs } from '../utils/searchJobs.js'

const SKILL_OPTIONS = getSkillOptions(mockJobs)

// "24 listings", or "3 of 24 listings match “react” and your filters" while searching or filtering.
function resultsSummary(count, total, query, isFiltered) {
  if (!query && !isFiltered) return `${total} listings`
  const criteria = [query && `“${query}”`, isFiltered && 'your filters'].filter(Boolean).join(' and ')
  return `${count} of ${total} listings ${count === 1 ? 'matches' : 'match'} ${criteria}`
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
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const closeFilterDrawer = useCallback(() => setFilterDrawerOpen(false), [])
  const searchInputRef = useRef(null)
  const listingsHeadingRef = useRef(null)
  const filtersHeadingId = useId()

  const searchedJobs = searchJobs(mockJobs, query)
  const jobs = filterJobs(searchedJobs, filters)
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
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              {/* Focus lands here when the filter controls someone was using disappear. */}
              <h2
                ref={listingsHeadingRef}
                id="job-listings-heading"
                tabIndex={-1}
                className="text-base font-semibold text-slate-900 focus:outline-none"
              >
                Job listings
              </h2>
              {/* A live region, so screen readers announce the new count after each change. */}
              <p role="status" className="text-sm text-slate-600">
                {resultsSummary(jobs.length, mockJobs.length, query, isFiltered)}
              </p>
            </div>
            <Badge variant="warning">
              <Info aria-hidden="true" className="size-3.5" />
              Sample data, not live postings
            </Badge>
          </div>

          {isFiltered && (
            <ActiveFilters
              activeFilters={activeFilters}
              onRemove={(filter) => updateFilters((current) => removeFilter(current, filter))}
              onClearAll={clearFilters}
              fallbackFocusRef={listingsHeadingRef}
            />
          )}

          {jobs.length > 0 ? (
            <JobList jobs={jobs} />
          ) : (
            <NoResults
              query={query}
              isFiltered={isFiltered}
              onClearSearch={clearSearch}
              onClearFilters={clearFiltersAndFocusResults}
            />
          )}
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
