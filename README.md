# HireHub

HireHub is a responsive job-search dashboard — a "job board command center" — built with
React and Vite. It brings searching, filtering, reviewing, and saving job listings into a
single workspace.

> **Demo data:** HireHub is designed to run on sample job listings served by a simulated API.
> Companies, vacancies, and salaries shown in the app are illustrative only — they are not
> live or verified job postings.

## Status

Early development. In place so far:

- Project tooling: Vite, React Router, Tailwind CSS, ESLint, and Vitest + React Testing Library
- The responsive app shell: sidebar navigation on desktop, a slide-over menu on smaller screens,
  and a top bar with a notifications panel and a demo profile
- Brand colors, typography, and a small set of reusable UI components
- 24 sample job listings from 10 fictional companies (`src/data/mockJobs.js`)
- The Discover Jobs page, which renders the sample listings as job cards
- Search on the Discover Jobs page: by title, company, location, skills, work arrangement,
  employment type, and experience level, with a live results count and an empty state when
  nothing matches (see [Search](#search))
- Filters on the Discover Jobs page: work arrangement, employment type, experience level,
  minimum salary, date posted, and skills (all or any), with job counts beside each option,
  removable filter chips, and clear-all (see [Filters](#filters))
- Sorting (most relevant, newest, highest salary) and numbered pages of 12 listings, both
  working together with the search and filters (see [Sorting and pages](#sorting-and-pages))
- A simulated job API with delays and controllable failures. The listings load from it once
  and are shared by every page, and the Discover Jobs page shows loading, failed (with
  "Try again"), and no-listings states (see [Simulated API](#simulated-api))
- Loading states: placeholder cards and filters with the layout of the real ones, a Refresh
  button that keeps the current listings on screen while new ones load, and a notice when a
  refresh fails (see [Loading states](#loading-states))

The Dashboard, Job Details, and Saved Jobs pages are still placeholders: they show the
planned layout and explain what will appear there. The features below are planned.

## Planned features

- Job details page and saved jobs persisted in `localStorage`
- Dashboard metrics computed from the listing data
- An error boundary, a development-only control for the simulated API's failures, and
  polished empty states
- Accessible, keyboard-friendly, responsive layout for desktop, tablet, and mobile

## Tech stack

| Area        | Tooling                                                       |
| ----------- | ------------------------------------------------------------- |
| UI          | React 19, React Router 8                                      |
| Build / dev | Vite 8                                                        |
| Styling     | Tailwind CSS 4 (via `@tailwindcss/vite`)                      |
| Icons       | Lucide React                                                  |
| Linting     | ESLint 10 (flat config) with React Hooks, React Refresh, and JSX a11y rules |
| Testing     | Vitest 5, React Testing Library, jsdom                        |

## Getting started

**Prerequisites:** Node.js 22.22 or newer (Node 24 LTS recommended) and npm.

```powershell
npm install
npm run dev
```

Then open <http://localhost:5173>.

## Scripts

| Command              | Description                                      |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Start the Vite development server                |
| `npm run build`      | Create a production build in `dist/`             |
| `npm run preview`    | Serve the production build locally               |
| `npm run lint`       | Run ESLint on the project                        |
| `npm test`           | Run the test suite once                          |
| `npm run test:watch` | Run tests in watch mode                          |

## Project structure

```text
public/                 Static assets (favicon)
src/
  app/                  App root and route definitions
    App.jsx             Creates the browser router
    router.jsx          Route objects (shared with tests)
  components/
    layout/             App shell: sidebar, top bar, mobile menu, primary navigation
    jobs/               Job cards and job-related UI
    filters/            Search and filter controls
    dashboard/          Dashboard components (metric cards)
    feedback/           Loading, error, and empty states
    ui/                 Reusable UI primitives (buttons, cards, badges, page header)
  context/              React context: the shared job listings (JobsProvider)
  data/                 Sample job data (fictional companies)
  hooks/                Custom hooks
  pages/                Route-level page components
  services/             Simulated API service layer
  styles/               Global styles and Tailwind entry point
  test/                 Test setup and test suites
  utils/                Pure helpers (formatting, search, filtering, sorting, pagination)
  main.jsx              Application entry point
```

## Sample data

`src/data/mockJobs.js` exports `mockJobs` (24 listings, newest first) and `companies`
(10 fictional companies). The data is for demonstration only. The companies are invented,
and the listings and salaries are illustrative, not real or verified job postings. The app
says so in the sidebar and on the Discover Jobs page. Pages do not import this file: they get
the listings through the [simulated API](#simulated-api).

Each listing has this shape:

| Field              | Values                                                                 |
| ------------------ | ---------------------------------------------------------------------- |
| `id`               | `'job-001'` … `'job-024'` (used in the `/jobs/:jobId` route)           |
| `title`, `location`, `description` | Text. Remote roles use locations such as `'Remote (US)'` |
| `company`          | One of the `companies` objects: `id`, `name`, `industry`, `size`, `headquarters`, `about` |
| `workArrangement`  | `'remote'`, `'hybrid'`, or `'on-site'`                                  |
| `employmentType`   | `'full-time'`, `'part-time'`, `'contract'`, or `'internship'`           |
| `experienceLevel`  | `'entry'`, `'mid'`, `'senior'`, or `'lead'`                             |
| `salary`           | `{ min, max, currency: 'USD', period: 'year' \| 'hour' }`, or `null` when not listed |
| `skills`           | Array of skill names, e.g. `['React', 'TypeScript']`                   |
| `postedAt`         | ISO date string                                                        |
| `responsibilities`, `qualifications` | Arrays of text, for the job details page             |

Posted dates are computed relative to when the app loads (from 3 hours to 45 days ago), so
the listings keep a realistic spread of ages however long after they were written.

`src/utils/formatJob.js` holds the display labels for the categorical fields
(`WORK_ARRANGEMENT_LABELS`, `EMPLOYMENT_TYPE_LABELS`, `EXPERIENCE_LEVEL_LABELS`) and the
formatters `formatSalary` ("$145K–$175K per year"), `formatPostedDate` ("3 days ago"), and
`formatFullDate` ("Oct 24, 2026").

## Simulated API

HireHub has no backend. `src/services/jobService.js` stands in for one: it answers from the
sample data after a delay, as a request over the network would, and it can be told to fail.
Components never import the sample data or set timers for this themselves.

| Function                   | Answers with                                                       |
| -------------------------- | ------------------------------------------------------------------ |
| `fetchJobs({ signal })`    | Every listing, newest first                                         |
| `fetchJob(id, { signal })` | One listing, or a `JobServiceError` with `code: 'not-found'`        |

- **Delay:** each answer takes a random 300–900 ms.
- **Failures:** `setSimulation({ mode: 'error' })` makes every request fail with a
  `JobServiceError` whose `code` is `'unavailable'`. `failureRate` (from 0 to 1) makes that
  share of requests fail in normal mode, like a flaky network. `mode: 'empty'` answers as if
  there were no listings. `resetSimulation()` restores the defaults, and requests already on
  their way finish with the settings they started with.
- **Aborting:** pass an `AbortSignal` to stop waiting. The request then rejects with an
  `AbortError`.
- **Copies:** answers are copies of the sample data, as if they had come over the network, so
  nothing in the app can change the data itself.

**Data access.** `JobsProvider` (`src/context/`) sits above every route. It requests the
listings once when the app starts and shares them, so going back to a page shows them straight
away instead of loading them again. Pages read them with `useJobs()` (`src/hooks/`), which
returns `{ jobs, status, error, reload }`. It is built on `useRequest(key, load)`, which tracks a
request's status (`'loading'`, `'success'`, or `'error'`) and keeps the latest answer while the
request runs again. It also handles stale requests: a new key, a retry, or unmounting aborts
the request before it, and an answer to that request is ignored even if it arrives later.

Search, filters, sorting, and pages work on the loaded listings in the browser, so they update
straight away without new requests.

**On the Discover Jobs page:**

- While the listings load for the first time, the count says "Loading job listings…" and
  placeholders stand in for the cards and filters (see [Loading states](#loading-states)). The
  search box works straight away, while the filter options, the Filters button, the sort order,
  and Refresh wait for the listings. A search, filters, order, and page in the URL apply as
  soon as the listings arrive.
- If the request fails, the results explain that the listings could not be loaded and offer
  **Try again**. If there are no listings at all, they say so and offer **Refresh**. Both move
  focus to the "Job listings" heading and load the listings again.
- The results area has `aria-busy="true"` while a request is on its way, and the count is a
  live region, so screen readers announce when the listings arrive.

## Loading states

- **Placeholders:** while the listings load for the first time, six placeholder cards (enough
  to fill the screen in every layout) and placeholder filter groups stand in for the real ones.
  They gently pulse, and stay still when the operating system asks for reduced motion. They
  are hidden from assistive technology; the count above the results says "Loading job
  listings…" in words instead.
- **No jumping:** each placeholder block takes the same space as the text it stands for, so a
  placeholder card is exactly as tall and wide as a job card with one row of skills (the usual
  case once there is room for two columns). The search box, the Filters button, the sort order,
  Refresh, and any filter chips from the URL are in place before the listings arrive, so
  nothing above the results moves when they do. Measured in Edge, the cumulative layout shift
  while the listings load is 0, on desktop and on a phone, with or without filters in the URL.
- **Refresh:** the button next to the sort order loads the listings again. The current
  listings stay on screen, dimmed and marked busy, while the count says "Refreshing job
  listings…" and the button's icon spins. Search, filters, sorting, and pages keep working on
  the listings on screen, and the new listings arrive under the same choices. Pressing Refresh
  again starts over, and the earlier request's answer is ignored.
- **A failed refresh** keeps the earlier listings and shows a notice (announced to screen
  readers) with **Try again**.

The pieces are `Skeleton` (`src/components/feedback/`), a pulsing block sized by its classes;
`JobCardSkeleton` and `JobListSkeleton` (`src/components/jobs/`); `FilterPanelSkeleton`
(`src/components/filters/`); and `MetricCard`'s `isLoading` option, for the dashboard metrics.

## Search

The search box on the Discover Jobs page narrows the listings as you type.

- **What it searches:** each listing's title, company name, location, and skills, plus the
  labels shown on its card for work arrangement, employment type, and experience level, so
  "remote", "internship", and "senior" work as search terms.
- **How it matches:** case and accents are ignored ("montreal" finds "Montréal"), and every
  word of the query must match somewhere in the listing, so "senior react" finds senior roles
  that list React. A word matches from the start of a word in the listing: "go" finds "Go"
  but not "Chicago". Results are sorted by relevance unless another order is chosen (see
  [Sorting and pages](#sorting-and-pages)).
- **When it runs:** results update once typing pauses for 300 ms, or immediately on Enter.
  The clear button and Escape empty the box and show every listing again.
- **Results:** a count above the list ("4 of 24 listings match “react”") is a live region, so
  screen readers announce it after each search. When nothing matches, an empty state explains
  why and offers a "Clear search" button that returns focus to the search box.
- **In the URL:** the query is stored as `?q=` (for example `/jobs?q=react`), so a search
  survives a reload and a trip to a job's details page and back. Typing replaces the current
  history entry instead of adding one per pause, and back/forward navigation updates the box.

The pieces are `searchJobs(jobs, query)` and `relevanceScorer(query)` in
`src/utils/searchJobs.js` (the pure matching and scoring logic), `useDebouncedValue` and `useSearchQuery` in `src/hooks/` (the debounce and the
box/URL state), and `SearchBar` in `src/components/filters/` (the search form).

## Filters

Filters narrow the listings further, together with the search. From the `xl` breakpoint
(1280px) they sit in a panel beside the results. On smaller screens the **Filters** button next
to the search box (which shows how many filters are active) opens the same panel in a
slide-over, whose footer button shows how many jobs match and closes it.

| Filter           | Choices                                                         |
| ---------------- | --------------------------------------------------------------- |
| Work arrangement | Remote, Hybrid, On-site                                         |
| Employment type  | Full-time, Part-time, Contract, Internship                      |
| Experience level | Entry level, Mid level, Senior level, Lead                      |
| Salary           | One minimum: $50K+, $75K+, $100K+, $150K+, or $200K+ per year     |
| Date posted      | One of: past 24 hours, 3 days, week, 2 weeks, or month          |
| Skills           | Any of the 68 skills in the listings; jobs must list all chosen skills, or any of them |

- **How filters combine:** choices within a group match any of them ("Remote" or "Hybrid"),
  and the groups combine, so a job has to pass every group that has a choice. Skills match
  all chosen skills by default; with two or more chosen, the panel offers "Any selected skill".
- **Salary:** a job passes when the top of its pay range reaches the minimum. Hourly rates are
  compared as full-time yearly pay (2,080 hours), and listings without a salary are left out
  while a minimum is set.
- **Date posted:** "Past week" keeps jobs posted less than 7 days ago, and so on.
- **Counts:** the number beside each option is how many jobs would show if it were the only
  choice in its group, with the search and the other groups applied.
- **Skills list:** the 10 most common skills show first, plus any already chosen. "Find a
  skill" narrows the list by name, and "Show all 68 skills" lists every one.
- **Active filters:** each choice appears as a chip above the results; removing a chip keeps
  the other filters, and "Clear all" removes them all. Focus moves to the next chip, or to the
  "Job listings" heading when the last one goes. When nothing matches, the empty state offers
  to clear the filters, the search, or both.
- **In the URL:** filters are stored next to the search, with one parameter per choice, for
  example `/jobs?q=engineer&arrangement=remote&arrangement=hybrid&skill=React&salary=100000&posted=7&match=any`.
  Like the search, they survive a reload and a trip to a job's details page, and changing them
  replaces the current history entry. Values the app does not offer are ignored.

The matching, counting, and chip logic is in `src/utils/filterJobs.js`, and the URL format in
`src/utils/filterParams.js`. `useJobFilters` (`src/hooks/`) connects them to the URL, and the
controls are in `src/components/filters/` (`FilterPanel`, `SkillFilter`, `ActiveFilters`, and
`FilterDrawer`).

## Sorting and pages

The **Sort by** control above the results orders them, and the results are split into pages
of 12 listings (whole rows in the one-, two-, and three-column layouts).

| Sort order     | Puts first                                                              |
| -------------- | ----------------------------------------------------------------------- |
| Most relevant  | The best matches for the search (the default)                           |
| Newest         | The most recently posted listings                                       |
| Highest salary | The highest top of the pay range per year; listings without a salary go last |

- **Relevance:** each word of the search scores by where it matches: 3 points in the title,
  2 in the company name or a skill, 1 in the location or a card label (work arrangement,
  employment type, experience level), plus 1 when it matches a whole word, so "java" ranks a
  job that lists Java above one that lists JavaScript. Each chosen skill a job lists adds a
  point, so with "Any selected skill" the jobs with more of them come first. Without a search
  or chosen skills, Most relevant is the same as Newest.
- **Salary:** hourly rates count as full-time yearly pay (2,080 hours), as in the salary filter.
- **Ties:** listings that score the same go newest first.
- **Pages:** a count above the results says which listings are showing ("24 listings, showing
  1–12"). Below them, Previous, Next, and a link to each page; long ranges keep the first and
  last pages and the pages around the current one, with "…" for the rest. Phones show
  "Page 1 of 2" between Previous and Next instead of the numbers. Previous and Next are
  disabled at either end, and the page links are hidden when every result fits on one page.
- **Moving between pages** scrolls back to the top of the results and moves focus to the
  "Job listings" heading, so keyboard and screen reader users start reading the new page from
  its top. The count above the results is a live region, so the new range is announced.
- **Starting over:** a new search, a filter change, or a new sort order goes back to page 1.
- **A page past the end** (for example an old link to page 5) shows an empty state that says
  where the results end, with links to page 1 and the last page.
- **In the URL:** the order is stored as `?sort=newest` or `?sort=salary` and the page as
  `?page=2`, next to the search and filters; each is left out at its default. Changing the
  order replaces the current history entry, like a filter change. Page links add one, so Back
  and Forward step between pages, and coming back from a job's details page returns to the same
  page. Orders the app does not offer, and page numbers that are not whole numbers from 1, are
  ignored.

The ordering is `sortJobs(jobs, sort, { query, skills })` in `src/utils/sortJobs.js`, the page
logic `paginate` and `getPageNumbers` in `src/utils/pagination.js`, and the URL format in
`src/utils/resultsParams.js`. `useSortOrder` and `useResultsPage` (`src/hooks/`) connect them to
the URL. The controls are `SortSelect` (`src/components/filters/`) and `Pagination`
(`src/components/ui/`).

Search, filter, and sort changes are written to the URL with React Router's `flushSync` option, so
they render straight away instead of in a transition: a checkbox shows its new state at once,
and a quick second change starts from the first. This needs the `RouterProvider` from
`react-router/dom`, which `src/app/App.jsx` and the tests use.

## Routes

| Path           | Page          |
| -------------- | ------------- |
| `/`            | Dashboard     |
| `/jobs`        | Discover Jobs (accepts `?q=` for a search, [filter parameters](#filters), and `?sort=` and `?page=` ([sorting and pages](#sorting-and-pages))) |
| `/jobs/:jobId` | Job Details   |
| `/saved`       | Saved Jobs    |
| any other path | Not Found     |

## UI foundation

- **Colors:** components use `brand-*` utilities, defined in `src/styles/index.css` as an alias
  of Tailwind's indigo scale. Neutrals use `slate-*`. The light theme is the default.
- **Typography and spacing:** Tailwind's system font stack and spacing scale. Page titles use
  `text-2xl`/`sm:text-3xl`, section titles `text-base font-semibold`, and body text `text-sm`.
- **Layout:** at the `lg` breakpoint (1024px) and up, a fixed 16rem sidebar holds the primary
  navigation. Below it, the sidebar is hidden and the menu button in the top bar opens the
  same navigation in a slide-over built on the native `<dialog>` element (the `Drawer`
  component). The browser then traps focus, closes it on Escape, and makes the page behind it
  inert.
- **Reusable components** (`src/components/ui`): `Button`, `ButtonLink`, `IconButton` (needs
  an accessible `label`), `Card`, `CardHeader`, `Badge`, `Avatar`, `PageHeader` (which also
  sets the document title), `Drawer` (a slide-over on a modal `<dialog>`, used by the
  mobile menu and the filters), and `Pagination` (Previous, Next, and page links built from a
  `pageLink(page)` function). `EmptyState` and `Skeleton` (`components/feedback`) and `MetricCard`
  (`components/dashboard`) build on them.
- **Job components** (`src/components/jobs`): `JobCard` shows a listing's role, company,
  work arrangement, employment type, experience level, location, salary ("Salary not
  listed" when there is none), skills, and posted date, with a "View details" link.
  `JobList` lays cards out in a grid whose columns follow the space the list has, using a
  container query (one column when narrow, two from 42rem, three from 64rem), so it adapts
  when the filter panel sits beside it. `CompanyLogo` is an initials placeholder whose color is
  derived from the company name.
- **Accessibility:** a skip link to the main content, visible focus outlines,
  `aria-current` on the active navigation link, and reduced motion when the operating system
  asks for it.

## Testing

Tests run in a jsdom environment with Vitest and React Testing Library. Test files live in
`src/test/` and match `*.test.js` / `*.test.jsx`:

| File                  | Covers                                                     |
| --------------------- | ---------------------------------------------------------- |
| `routing.test.jsx`    | Routes, document titles, navigation state, skip link        |
| `layout.test.jsx`     | App shell, mobile menu, notifications panel                 |
| `ui.test.jsx`         | Reusable UI components, including the pagination bar, placeholders, and loading metric cards |
| `jobs.test.jsx`       | Job card and its placeholder, company logo, and the Discover Jobs listing page |
| `formatJob.test.js`   | Salary and posted-date formatting                           |
| `mockJobs.test.js`    | Sample data integrity (ids, field values, dates, salaries)  |
| `searchJobs.test.js`  | Search matching (case, accents, multiple words, word starts, special characters) and relevance scores |
| `useDebouncedValue.test.js` | Debounce timing, restarts, and cleanup on unmount     |
| `search.test.jsx`     | Search on the Discover Jobs page: debounce, Enter, clearing, empty state, URL and history |
| `filterJobs.test.js`  | Filter matching (OR within a group, AND across groups, skills all/any, salary, dates), chips, and option counts |
| `filterParams.test.js` | Reading and writing filters in the URL, including values the app does not offer and skills read before the listings load |
| `filters.test.jsx`    | Filters on the Discover Jobs page: every group, chips and focus, clear-all, search together, URL, empty states, the drawer |
| `sortJobs.test.js`    | Sorting by relevance, date, and salary: weights, whole words, chosen skills, hourly pay, missing salaries, ties |
| `pagination.test.js`  | Splitting results into pages and choosing which page numbers to show |
| `resultsParams.test.js` | Reading and writing the sort order and page in the URL, including invalid values |
| `results.test.jsx`    | Sorting and pages on the Discover Jobs page: order, URL and history, going back to page 1, pages past the end, focus |
| `jobService.test.js`  | The simulated API: delays, copies, error and empty modes, failure rate, aborting, not-found |
| `useRequest.test.jsx` | Request state, retries, keeping data while reloading, ignoring stale answers, aborting on unmount |
| `listingsData.test.jsx` | The Discover Jobs page with the simulated API: loading, failure and Try again, no listings, URL state applied on arrival, listings shared between pages |
| `loadingStates.test.jsx` | Slow requests: controls and chips in place while loading, searching and removing filters during a load, Refresh keeping listings on screen, changes made during a refresh, a repeated refresh, a failed refresh |

```powershell
npm test
```

`src/test/setup.js` registers the `jest-dom` matchers, cleans up after each test, and adds a
minimal `showModal()`/`close()` shim, because jsdom does not implement the `<dialog>` modal
API, and an empty `scrollIntoView()`, because jsdom does not lay pages out. It also sets the
simulated API to answer without a delay and resets its settings after every test.

Route-level tests use `renderRoute(path)` from `src/test/renderRoute.jsx`, which mounts the
real route objects from `src/app/router.jsx` in a memory router. It is async and waits until
the listings have arrived, so tests start from a loaded page (`await renderRoute('/jobs')`).
Tests of the loading state set a delay first, for example
`setSimulation({ minDelayMs: 50, maxDelayMs: 50 })`, and tests of failures set
`mode: 'error'` or `'empty'`.

Tests that depend on the search debounce use Vitest's fake timers. Testing Library only
advances fake timers when it finds a global `jest` object, so `search.test.jsx` stubs one that
forwards to `vi.advanceTimersByTime`; without it, `user-event` calls never finish.

## Git workflow

Work happens on feature branches (`feature/account1/...`, `feature/account2/...`) and is
merged into `main` only after it has been reviewed, linted, tested, and built successfully.
