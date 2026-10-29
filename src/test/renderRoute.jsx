import { act, render } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { routes } from '../app/router.jsx'

// Renders the app's real route tree at `path` in a memory router. Tests run the simulated API
// without a delay (see setup.js), so by the time this resolves the job listings have arrived.
export async function renderRoute(path) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  await act(async () => {
    render(<RouterProvider router={router} />)
  })
  return router
}
