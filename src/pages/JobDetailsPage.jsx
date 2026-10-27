import { ArrowLeft, FileText } from 'lucide-react'
import { useParams } from 'react-router'
import EmptyState from '../components/feedback/EmptyState.jsx'
import { ButtonLink } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'

export default function JobDetailsPage() {
  const { jobId } = useParams()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Details"
        actions={
          <ButtonLink to="/jobs" variant="secondary">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to jobs
          </ButtonLink>
        }
      />
      <Card>
        <EmptyState
          icon={FileText}
          title="Job details are not available yet"
          description={
            <>
              The full description, responsibilities, and qualifications for listing{' '}
              <span className="font-medium text-slate-900">{jobId}</span> will appear here.
            </>
          }
        />
      </Card>
    </div>
  )
}
