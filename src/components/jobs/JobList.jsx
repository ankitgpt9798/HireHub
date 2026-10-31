import JobCard, { JobCardSkeleton } from './JobCard.jsx'

// Columns follow the space the list has (a container query), not the viewport, because a
// filter panel can sit beside it.
const gridClasses = 'grid gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3'

export default function JobList({ jobs }) {
  return (
    <div className="@container">
      <ul className={gridClasses}>
        {jobs.map((job) => (
          <li key={job.id}>
            <JobCard job={job} />
          </li>
        ))}
      </ul>
    </div>
  )
}

// `count` card placeholders in the same grid, for while the listings load. Hidden from
// assistive technology; the page says in words that the listings are loading.
export function JobListSkeleton({ count }) {
  return (
    <div aria-hidden="true" className="@container">
      <div className={gridClasses}>
        {Array.from({ length: count }, (_, index) => (
          <JobCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}
