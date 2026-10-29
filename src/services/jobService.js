// A simulated job listings API. It answers from the sample data in `src/data/mockJobs.js`
// after a short delay, as a real API would answer over the network, and it can be told to fail
// or to have no listings, so the app's loading, error, and empty states can be seen and tested.
// All of the simulated network behaviour lives here: components and hooks set no timers of
// their own.

import { mockJobs } from '../data/mockJobs.js'

// How the simulated API behaves until `setSimulation` changes it.
export const DEFAULT_SIMULATION = Object.freeze({
  // Each response takes a random time in this range, in milliseconds.
  minDelayMs: 300,
  maxDelayMs: 900,
  // 'normal', 'error' (every request fails), or 'empty' (there are no listings).
  mode: 'normal',
  // In 'normal' mode, the chance (from 0 to 1) that a request fails anyway, like a flaky network.
  failureRate: 0,
})

let simulation = { ...DEFAULT_SIMULATION }

export function getSimulation() {
  return { ...simulation }
}

// Changes some of the settings, for example `setSimulation({ mode: 'error' })`. Requests already
// on their way finish with the settings they started with.
export function setSimulation(changes) {
  simulation = { ...simulation, ...changes }
}

export function resetSimulation() {
  simulation = { ...DEFAULT_SIMULATION }
}

// What the API answers with when a request fails. `code` is 'unavailable' (the service did not
// answer, so trying again may work) or 'not-found' (no job has the requested id).
export class JobServiceError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'JobServiceError'
    this.code = code
  }
}

// Resolves after `ms`, or rejects with the abort reason as soon as `signal` aborts. With no
// delay it still answers asynchronously, as a network request would.
function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    signal?.throwIfAborted()
    if (ms <= 0) {
      resolve()
      return
    }

    function handleAbort() {
      clearTimeout(timer)
      reject(signal.reason)
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort)
      resolve()
    }, ms)
    signal?.addEventListener('abort', handleAbort, { once: true })
  })
}

// Answers one request with the current settings: after the delay, either with a copy of what
// `respond()` returns (as if it had come over the network, so callers cannot change the sample
// data) or with an error. Aborting `signal` rejects it with the abort reason.
async function simulateRequest(respond, signal) {
  const { minDelayMs, maxDelayMs, mode, failureRate } = simulation
  await wait(minDelayMs + Math.random() * (maxDelayMs - minDelayMs), signal)

  if (mode === 'error' || (mode === 'normal' && Math.random() < failureRate)) {
    throw new JobServiceError('unavailable', 'The job service did not respond.')
  }
  return structuredClone(respond(mode === 'empty' ? [] : mockJobs))
}

// Every job listing, newest first.
export function fetchJobs({ signal } = {}) {
  return simulateRequest((jobs) => jobs, signal)
}

// One job listing by its id. Rejects with a 'not-found' error when no job has that id.
export function fetchJob(jobId, { signal } = {}) {
  return simulateRequest((jobs) => {
    const job = jobs.find((candidate) => candidate.id === jobId)
    if (!job) throw new JobServiceError('not-found', `No job has the id “${jobId}”.`)
    return job
  }, signal)
}
