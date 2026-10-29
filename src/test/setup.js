import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { resetSimulation, setSimulation } from '../services/jobService.js'

// jsdom does not implement the <dialog> modal API. This minimal shim covers what
// the app relies on (opening and closing); browsers provide the real behavior.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true
  }
}
if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function close() {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
}

// jsdom does not lay pages out, so it has no scrolling to do.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {}
}

// The simulated API answers without a delay unless a test asks for one, and every test starts
// from its default settings.
beforeEach(() => {
  setSimulation({ minDelayMs: 0, maxDelayMs: 0 })
})

afterEach(() => {
  cleanup()
  resetSimulation()
})
