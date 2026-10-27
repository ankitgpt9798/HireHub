import { Bookmark, BriefcaseBusiness, CalendarClock, Globe, Inbox, Search } from 'lucide-react'
import MetricCard from '../components/dashboard/MetricCard.jsx'
import EmptyState from '../components/feedback/EmptyState.jsx'
import { ButtonLink } from '../components/ui/Button.jsx'
import { Card, CardHeader } from '../components/ui/Card.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'

const metrics = [
  { label: 'Total jobs', icon: BriefcaseBusiness },
  { label: 'Remote roles', icon: Globe },
  { label: 'Saved jobs', icon: Bookmark },
  { label: 'Posted this week', icon: CalendarClock },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="An overview of job openings and the roles you have saved."
        actions={
          <ButtonLink to="/jobs">
            <Search aria-hidden="true" className="size-4" />
            Discover jobs
          </ButtonLink>
        }
      />

      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="text-base font-semibold text-slate-900">
          Overview
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {metrics.map((metric) => (
            <li key={metric.label}>
              <MetricCard label={metric.label} icon={metric.icon} />
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card as="section" aria-labelledby="recent-listings-heading" className="lg:col-span-2">
          <CardHeader title="Recent listings" titleId="recent-listings-heading" />
          <EmptyState
            icon={Inbox}
            titleAs="h3"
            title="Recent listings will appear here"
            description="A summary of newly posted jobs is on the way. Until then, browse every listing on Discover Jobs."
            action={
              <ButtonLink to="/jobs" variant="secondary">
                Browse jobs
              </ButtonLink>
            }
          />
        </Card>
        <Card as="section" aria-labelledby="saved-summary-heading">
          <CardHeader title="Saved jobs" titleId="saved-summary-heading" />
          <EmptyState
            icon={Bookmark}
            titleAs="h3"
            title="Nothing saved yet"
            description="Jobs you save will be summarized here."
          />
        </Card>
      </div>
    </div>
  )
}
