import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '../../utils/cn.js'
import { getPageNumbers, PAGE_GAP } from '../../utils/pagination.js'
import { Button, ButtonLink } from './Button.jsx'

// Previous or Next. On the first or last page it is a disabled button, so the bar keeps its
// layout and screen readers still hear that there is no page that way.
function StepLink({ to, rel, onNavigate, children }) {
  if (!to) {
    return (
      <Button variant="secondary" disabled>
        {children}
      </Button>
    )
  }
  return (
    <ButtonLink to={to} rel={rel} variant="secondary" onClick={onNavigate}>
      {children}
    </ButtonLink>
  )
}

// Links to the pages of a list, with Previous and Next. Phones show "Page 2 of 5" between
// Previous and Next instead of the page numbers. `pageLink(n)` is the link target for page
// `n`, and `onNavigate` runs when one of the links is followed, for example to move focus to
// the top of the list.
export function Pagination({ page, pageCount, pageLink, onNavigate, label = 'Pagination' }) {
  return (
    <nav aria-label={label} className="flex items-center justify-between gap-2">
      <StepLink to={page > 1 && pageLink(page - 1)} rel="prev" onNavigate={onNavigate}>
        <ChevronLeft aria-hidden="true" className="-ml-1 size-4" />
        Previous <span className="sr-only">page</span>
      </StepLink>

      <p className="text-sm text-slate-600 sm:hidden">
        Page {page} of {pageCount}
      </p>
      <ul className="hidden items-center gap-1 sm:flex">
        {getPageNumbers(page, pageCount).map((pageNumber, index) =>
          pageNumber === PAGE_GAP ? (
            <li key={`gap-${index}`} aria-hidden="true" className="w-8 text-center text-slate-400">
              …
            </li>
          ) : (
            <li key={pageNumber}>
              <Link
                to={pageLink(pageNumber)}
                aria-current={pageNumber === page ? 'page' : undefined}
                onClick={onNavigate}
                className={cn(
                  'inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-medium tabular-nums transition-colors',
                  pageNumber === page
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                <span className="sr-only">Page</span> {pageNumber}
              </Link>
            </li>
          ),
        )}
      </ul>

      <StepLink to={page < pageCount && pageLink(page + 1)} rel="next" onNavigate={onNavigate}>
        Next <span className="sr-only">page</span>
        <ChevronRight aria-hidden="true" className="-mr-1 size-4" />
      </StepLink>
    </nav>
  )
}
