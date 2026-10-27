import { Info } from 'lucide-react'
import JobList from '../components/jobs/JobList.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { mockJobs } from '../data/mockJobs.js'

export default function DiscoverJobsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Discover Jobs"
        description="Browse sample job listings across engineering, design, data, and product."
      />

      <section aria-labelledby="job-listings-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="job-listings-heading" className="text-base font-semibold text-slate-900">
              Job listings
            </h2>
            <p className="text-sm text-slate-600">{mockJobs.length} listings</p>
          </div>
          <Badge variant="warning">
            <Info aria-hidden="true" className="size-3.5" />
            Sample data, not live postings
          </Badge>
        </div>

        <JobList jobs={mockJobs} />
      </section>
    </div>
  )
}
