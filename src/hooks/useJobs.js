import { use } from 'react'
import { JobsContext } from '../context/JobsContext.js'

// The job listings from `JobsProvider`: `{ jobs, status, error, reload }`.
// - `jobs`: every listing, or undefined until the first answer arrives.
// - `status`: 'loading', 'success', or 'error'.
// - `error`: why the latest request failed (a `JobServiceError`), or null.
// - `reload()`: asks for the listings again, keeping the current ones until the answer arrives.
export function useJobs() {
  const jobs = use(JobsContext)
  if (!jobs) throw new Error('useJobs must be used inside a JobsProvider.')
  return jobs
}
