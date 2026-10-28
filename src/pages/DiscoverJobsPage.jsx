import { Info, SearchX } from 'lucide-react'
import { useRef } from 'react'
import EmptyState from '../components/feedback/EmptyState.jsx'
import SearchBar from '../components/filters/SearchBar.jsx'
import JobList from '../components/jobs/JobList.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { mockJobs } from '../data/mockJobs.js'
import { useSearchQuery } from '../hooks/useSearchQuery.js'
import { searchJobs } from '../utils/searchJobs.js'

// "24 listings", or "3 of 24 listings match “react”" while searching.
function resultsSummary(count, total, query) {
  if (!query) return `${total} listings`
  return `${count} of ${total} listings ${count === 1 ? 'matches' : 'match'} “${query}”`
}

export default function DiscoverJobsPage() {
  const { query, input, setInput, applyInput } = useSearchQuery()
  const searchInputRef = useRef(null)
  const jobs = searchJobs(mockJobs, query)

  function clearSearch() {
    applyInput('')
    searchInputRef.current.focus()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discover Jobs"
        description="Browse sample job listings across engineering, design, data, and product."
      />

      <SearchBar
        ref={searchInputRef}
        label="Search jobs"
        placeholder="Search by title, company, location, or skill"
        value={input}
        onChange={setInput}
        onSearch={applyInput}
        onClear={clearSearch}
      />

      <section aria-labelledby="job-listings-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="job-listings-heading" className="text-base font-semibold text-slate-900">
              Job listings
            </h2>
            {/* A live region, so screen readers announce the new count after each search. */}
            <p role="status" className="text-sm text-slate-600">
              {resultsSummary(jobs.length, mockJobs.length, query)}
            </p>
          </div>
          <Badge variant="warning">
            <Info aria-hidden="true" className="size-3.5" />
            Sample data, not live postings
          </Badge>
        </div>

        {jobs.length > 0 ? (
          <JobList jobs={jobs} />
        ) : (
          <Card>
            <EmptyState
              icon={SearchX}
              titleAs="h3"
              title="No jobs match your search"
              description={`Nothing matches “${query}”. Check the spelling, or try a broader term such as a skill, company, or city.`}
              action={
                <Button variant="secondary" onClick={clearSearch}>
                  Clear search
                </Button>
              }
            />
          </Card>
        )}
      </section>
    </div>
  )
}
