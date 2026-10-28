import { createBrowserRouter } from 'react-router'
// The react-router/dom provider can apply navigations with `flushSync`, which the URL-backed
// search and filters use.
import { RouterProvider } from 'react-router/dom'
import { routes } from './router.jsx'

const router = createBrowserRouter(routes)

export default function App() {
  return <RouterProvider router={router} />
}
