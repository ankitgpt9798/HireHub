import { useRequest } from '../hooks/useRequest.js'
import { fetchJobs } from '../services/jobService.js'
import { JobsContext } from './JobsContext.js'

// Loads the job listings once for the whole app, so every page shares them and returning to a
// page shows them straight away instead of loading them again. Pages read them with `useJobs`.
export default function JobsProvider({ children }) {
  const { data, status, error, retry } = useRequest('jobs', (signal) => fetchJobs({ signal }))

  return <JobsContext value={{ jobs: data, status, error, reload: retry }}>{children}</JobsContext>
}
