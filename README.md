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

The Dashboard, Job Details, and Saved Jobs pages are still placeholders: they show the
planned layout and explain what will appear there. The features below are planned.

## Planned features

- Multi-tag filtering (work arrangement, employment type, experience level, salary, date
  posted, skills) with removable filter chips and clear-all
- Sorting and pagination that work together with search and filters
- Job details page and saved jobs persisted in `localStorage`
- Dashboard metrics computed from the listing data
- Simulated API with loading skeletons, error handling with retry, and empty states
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
  context/              React context providers
  data/                 Sample job data (fictional companies)
  hooks/                Custom hooks
  pages/                Route-level page components
  services/             Simulated API service layer
  styles/               Global styles and Tailwind entry point
  test/                 Test setup and test suites
  utils/                Pure helpers (formatting, search, and later filtering and sorting)
  main.jsx              Application entry point
```

Empty folders contain a `.gitkeep` file until their first module is added.

## Sample data

`src/data/mockJobs.js` exports `mockJobs` (24 listings, newest first) and `companies`
(10 fictional companies). The data is for demonstration only. The companies are invented,
and the listings and salaries are illustrative, not real or verified job postings. The app
says so in the sidebar and on the Discover Jobs page.

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

## Search

The search box on the Discover Jobs page narrows the listings as you type.

- **What it searches:** each listing's title, company name, location, and skills, plus the
  labels shown on its card for work arrangement, employment type, and experience level, so
  "remote", "internship", and "senior" work as search terms.
- **How it matches:** case and accents are ignored ("montreal" finds "Montréal"), and every
  word of the query must match somewhere in the listing, so "senior react" finds senior roles
  that list React. A word matches from the start of a word in the listing: "go" finds "Go"
  but not "Chicago". Results keep their original order.
- **When it runs:** results update once typing pauses for 300 ms, or immediately on Enter.
  The clear button and Escape empty the box and show every listing again.
- **Results:** a count above the list ("4 of 24 listings match “react”") is a live region, so
  screen readers announce it after each search. When nothing matches, an empty state explains
  why and offers a "Clear search" button that returns focus to the search box.
- **In the URL:** the query is stored as `?q=` (for example `/jobs?q=react`), so a search
  survives a reload and a trip to a job's details page and back. Typing replaces the current
  history entry instead of adding one per pause, and back/forward navigation updates the box.

The pieces are `searchJobs(jobs, query)` in `src/utils/searchJobs.js` (the pure matching
logic), `useDebouncedValue` and `useSearchQuery` in `src/hooks/` (the debounce and the
box/URL state), and `SearchBar` in `src/components/filters/` (the search form).

## Routes

| Path           | Page          |
| -------------- | ------------- |
| `/`            | Dashboard     |
| `/jobs`        | Discover Jobs (accepts `?q=` for a search) |
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
  same navigation in a slide-over built on the native `<dialog>` element. The browser then
  traps focus, closes it on Escape, and makes the page behind it inert.
- **Reusable components** (`src/components/ui`): `Button`, `ButtonLink`, `IconButton` (needs
  an accessible `label`), `Card`, `CardHeader`, `Badge`, `Avatar`, and `PageHeader` (which also
  sets the document title). `EmptyState` (`components/feedback`) and `MetricCard`
  (`components/dashboard`) build on them.
- **Job components** (`src/components/jobs`): `JobCard` shows a listing's role, company,
  work arrangement, employment type, experience level, location, salary ("Salary not
  listed" when there is none), skills, and posted date, with a "View details" link.
  `JobList` lays cards out in a responsive grid (one column on phones, two from the `md`
  breakpoint, three at `2xl`). `CompanyLogo` is an initials placeholder whose color is
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
| `ui.test.jsx`         | Reusable UI components                                      |
| `jobs.test.jsx`       | Job card, company logo, and the Discover Jobs listing page   |
| `formatJob.test.js`   | Salary and posted-date formatting                           |
| `mockJobs.test.js`    | Sample data integrity (ids, field values, dates, salaries)  |
| `searchJobs.test.js`  | Search matching: case, accents, multiple words, word starts, special characters |
| `useDebouncedValue.test.js` | Debounce timing, restarts, and cleanup on unmount     |
| `search.test.jsx`     | Search on the Discover Jobs page: debounce, Enter, clearing, empty state, URL and history |

```powershell
npm test
```

`src/test/setup.js` registers the `jest-dom` matchers, cleans up after each test, and adds a
minimal `showModal()`/`close()` shim, because jsdom does not implement the `<dialog>` modal
API. Route-level tests use `src/test/renderRoute.jsx`, which mounts the real route objects
from `src/app/router.jsx` in a memory router.

Tests that depend on the search debounce use Vitest's fake timers. Testing Library only
advances fake timers when it finds a global `jest` object, so `search.test.jsx` stubs one that
forwards to `vi.advanceTimersByTime`; without it, `user-event` calls never finish.

## Git workflow

Work happens on feature branches (`feature/account1/...`, `feature/account2/...`) and is
merged into `main` only after it has been reviewed, linted, tested, and built successfully.
