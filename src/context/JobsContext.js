import { createContext } from 'react'

// The job listings shared by every page: `{ jobs, status, error, reload }`. `JobsProvider`
// supplies it and `useJobs` reads it.
export const JobsContext = createContext(null)
