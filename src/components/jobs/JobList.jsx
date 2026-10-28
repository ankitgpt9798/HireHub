import JobCard from './JobCard.jsx'

// Columns follow the space the list has (a container query), not the viewport, because a
// filter panel can sit beside it.
export default function JobList({ jobs }) {
  return (
    <div className="@container">
      <ul className="grid gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
        {jobs.map((job) => (
          <li key={job.id}>
            <JobCard job={job} />
          </li>
        ))}
      </ul>
    </div>
  )
}
