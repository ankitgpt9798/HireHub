import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockJobs } from '../data/mockJobs.js'
import {
  DEFAULT_SIMULATION,
  fetchJob,
  fetchJobs,
  getSimulation,
  JobServiceError,
  resetSimulation,
  setSimulation,
} from '../services/jobService.js'

// Tracks whether a promise has settled, without waiting for it.
function track(promise) {
  const state = { settled: false, value: undefined, error: undefined }
  promise.then(
    (value) => Object.assign(state, { settled: true, value }),
    (error) => Object.assign(state, { settled: true, error }),
  )
  return state
}

describe('simulation settings', () => {
  it('starts from the defaults and can be changed and reset', () => {
    resetSimulation()
    expect(getSimulation()).toEqual({ minDelayMs: 300, maxDelayMs: 900, mode: 'normal', failureRate: 0 })

    setSimulation({ mode: 'error', minDelayMs: 0 })
    expect(getSimulation()).toEqual({ ...DEFAULT_SIMULATION, mode: 'error', minDelayMs: 0 })

    resetSimulation()
    expect(getSimulation()).toEqual(DEFAULT_SIMULATION)
  })

  it('hands out copies of the settings', () => {
    getSimulation().mode = 'error'
    expect(getSimulation().mode).toBe('normal')
  })
})

describe('job service', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('fetchJobs', () => {
    it('answers with every listing after the delay', async () => {
      setSimulation({ minDelayMs: 500, maxDelayMs: 500 })
      const request = track(fetchJobs())

      await vi.advanceTimersByTimeAsync(499)
      expect(request.settled).toBe(false)

      await vi.advanceTimersByTimeAsync(1)
      expect(request.value).toEqual(mockJobs)
    })

    it('waits a random time within the delay range', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.25)
      setSimulation({ minDelayMs: 200, maxDelayMs: 600 })
      const request = track(fetchJobs())

      await vi.advanceTimersByTimeAsync(299)
      expect(request.settled).toBe(false)
      await vi.advanceTimersByTimeAsync(1)
      expect(request.settled).toBe(true)
    })

    it('answers without a timer when there is no delay', async () => {
      const request = track(fetchJobs())

      expect(vi.getTimerCount()).toBe(0)
      await vi.advanceTimersByTimeAsync(0)
      expect(request.value).toHaveLength(mockJobs.length)
    })

    it('answers with copies, so changing them leaves the sample data alone', async () => {
      const jobs = await fetchJobs()

      expect(jobs).not.toBe(mockJobs)
      expect(jobs[0]).not.toBe(mockJobs[0])
      jobs[0].title = 'Changed'
      jobs[0].skills.push('Changed')
      expect(mockJobs[0].title).not.toBe('Changed')
      expect(mockJobs[0].skills).not.toContain('Changed')
    })

    it('answers with no listings in empty mode', async () => {
      setSimulation({ mode: 'empty' })
      await expect(fetchJobs()).resolves.toEqual([])
    })

    it('fails every request in error mode, after the delay', async () => {
      setSimulation({ mode: 'error', minDelayMs: 300, maxDelayMs: 300 })
      const request = track(fetchJobs())

      await vi.advanceTimersByTimeAsync(299)
      expect(request.settled).toBe(false)
      await vi.advanceTimersByTimeAsync(1)

      expect(request.error).toBeInstanceOf(JobServiceError)
      expect(request.error).toMatchObject({ name: 'JobServiceError', code: 'unavailable' })
    })

    it('fails requests at the failure rate', async () => {
      setSimulation({ failureRate: 0.3 })
      const random = vi.spyOn(Math, 'random')

      random.mockReturnValue(0.29)
      await expect(fetchJobs()).rejects.toMatchObject({ code: 'unavailable' })

      random.mockReturnValue(0.3)
      await expect(fetchJobs()).resolves.toHaveLength(mockJobs.length)
    })

    it('uses the settings a request started with', async () => {
      setSimulation({ minDelayMs: 100, maxDelayMs: 100 })
      const request = track(fetchJobs())
      setSimulation({ mode: 'error' })

      await vi.advanceTimersByTimeAsync(100)
      expect(request.value).toHaveLength(mockJobs.length)
    })

    it('stops waiting and rejects when the request is aborted', async () => {
      setSimulation({ minDelayMs: 500, maxDelayMs: 500 })
      const controller = new AbortController()
      const request = track(fetchJobs({ signal: controller.signal }))

      await vi.advanceTimersByTimeAsync(100)
      controller.abort()
      await vi.advanceTimersByTimeAsync(0)

      expect(request.error).toMatchObject({ name: 'AbortError' })
      expect(vi.getTimerCount()).toBe(0)
    })

    it('rejects straight away when the signal has already aborted', async () => {
      setSimulation({ minDelayMs: 500, maxDelayMs: 500 })
      const controller = new AbortController()
      controller.abort()

      await expect(fetchJobs({ signal: controller.signal })).rejects.toMatchObject({
        name: 'AbortError',
      })
      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('fetchJob', () => {
    it('answers with one listing, as a copy', async () => {
      const job = await fetchJob('job-007')

      expect(job).toEqual(mockJobs.find((candidate) => candidate.id === 'job-007'))
      expect(job).not.toBe(mockJobs.find((candidate) => candidate.id === 'job-007'))
    })

    it('rejects with a not-found error for an unknown id', async () => {
      await expect(fetchJob('job-999')).rejects.toMatchObject({
        name: 'JobServiceError',
        code: 'not-found',
      })
    })

    it('finds no listing in empty mode and fails in error mode', async () => {
      setSimulation({ mode: 'empty' })
      await expect(fetchJob('job-001')).rejects.toMatchObject({ code: 'not-found' })

      setSimulation({ mode: 'error' })
      await expect(fetchJob('job-001')).rejects.toMatchObject({ code: 'unavailable' })
    })

    it('can be aborted', async () => {
      setSimulation({ minDelayMs: 500, maxDelayMs: 500 })
      const controller = new AbortController()
      const request = track(fetchJob('job-001', { signal: controller.signal }))

      controller.abort()
      await vi.advanceTimersByTimeAsync(0)
      expect(request.error).toMatchObject({ name: 'AbortError' })
    })
  })
})
