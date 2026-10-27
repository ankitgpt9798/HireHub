import JobCard from './JobCard.jsx'

export default function JobList({ jobs }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {jobs.map((job) => (
        <li key={job.id}>
          <JobCard job={job} />
        </li>
      ))}
    </ul>
  )
}
