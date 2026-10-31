import { Banknote, MapPin } from 'lucide-react'
import { useId } from 'react'
import { Skeleton } from '../feedback/Skeleton.jsx'
import { Badge } from '../ui/Badge.jsx'
import { ButtonLink } from '../ui/Button.jsx'
import { Card } from '../ui/Card.jsx'
import {
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  formatFullDate,
  formatPostedDate,
  formatSalary,
  WORK_ARRANGEMENT_LABELS,
} from '../../utils/formatJob.js'
import CompanyLogo from './CompanyLogo.jsx'

export default function JobCard({ job }) {
  const titleId = useId()
  const salary = formatSalary(job.salary)

  return (
    <Card as="article" aria-labelledby={titleId} className="flex h-full flex-col p-5">
      <div className="flex items-start gap-3">
        <CompanyLogo name={job.company.name} />
        <div className="min-w-0">
          <h3 id={titleId} className="text-base leading-snug font-semibold text-slate-900">
            {job.title}
          </h3>
          <p className="mt-0.5 text-sm text-slate-600">{job.company.name}</p>
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap gap-2">
        <li>
          <Badge variant="brand">{WORK_ARRANGEMENT_LABELS[job.workArrangement]}</Badge>
        </li>
        <li>
          <Badge>{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
        </li>
        <li>
          <Badge>{EXPERIENCE_LEVEL_LABELS[job.experienceLevel]}</Badge>
        </li>
      </ul>

      <dl className="mt-4 space-y-1.5 text-sm text-slate-700">
        <div className="flex items-center gap-2">
          <dt>
            <MapPin aria-hidden="true" className="size-4 text-slate-400" />
            <span className="sr-only">Location</span>
          </dt>
          <dd>{job.location}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt>
            <Banknote aria-hidden="true" className="size-4 text-slate-400" />
            <span className="sr-only">Salary</span>
          </dt>
          <dd className={salary ? undefined : 'text-slate-500'}>{salary ?? 'Salary not listed'}</dd>
        </div>
      </dl>

      <ul aria-label="Skills" className="mt-4 mb-4 flex flex-wrap gap-1.5">
        {job.skills.map((skill) => (
          <li key={skill} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
            {skill}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">
          Posted{' '}
          <time dateTime={job.postedAt} title={formatFullDate(job.postedAt)}>
            {formatPostedDate(job.postedAt)}
          </time>
        </p>
        <ButtonLink to={`/jobs/${job.id}`} variant="secondary" size="sm">
          View details{' '}
          <span className="sr-only">
            for {job.title} at {job.company.name}
          </span>
        </ButtonLink>
      </div>
    </Card>
  )
}

// A placeholder with the layout of a job card, for while the listings load. Each block sits in
// the same space as the text it stands for (the `my-*` margins make up the line height), so
// the page does not jump when the real cards replace it.
export function JobCardSkeleton() {
  return (
    <Card aria-hidden="true" className="flex h-full flex-col p-5">
      <div className="flex items-start gap-3">
        <Skeleton className="size-11 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <Skeleton className="my-[3px] h-4 w-3/5" />
          <Skeleton className="mt-[5px] mb-[3px] h-3.5 w-2/5" />
        </div>
      </div>

      {/* The badges sit in list items with the page's 24px line height. */}
      <div className="mt-4 flex h-6 items-center gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-[4.5rem] rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>

      <div className="mt-4 space-y-1.5">
        {['w-2/5', 'w-1/2'].map((width) => (
          <div key={width} className="flex h-5 items-center gap-2">
            <Skeleton className="size-4 rounded" />
            <Skeleton className={`h-3.5 ${width}`} />
          </div>
        ))}
      </div>

      {/* One row of skill tags, as most cards have once there is room for two columns. */}
      <div className="mt-4 mb-4 flex gap-1.5">
        <Skeleton className="h-5 w-14" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-12" />
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
    </Card>
  )
}
