import { X } from 'lucide-react'
import { useId, useRef } from 'react'
import { Button } from '../ui/Button.jsx'
import { Drawer } from '../ui/Drawer.jsx'
import { IconButton } from '../ui/IconButton.jsx'
import FilterPanel from './FilterPanel.jsx'

// Matches Tailwind's `xl` breakpoint, where the filters show beside the results instead.
const wideScreenQuery = '(min-width: 80rem)'

// The filter panel in a slide-over, for screens below `xl`. Filters apply as they change; the
// footer button shows how many jobs match and closes the drawer.
export default function FilterDrawer({
  isOpen,
  onClose,
  resultCount,
  isFiltered,
  onClearAll,
  ...panelProps
}) {
  const titleId = useId()
  const showResultsRef = useRef(null)

  function handleClearAll() {
    onClearAll()
    // "Clear all" disappears once nothing is chosen, so keep focus inside the drawer.
    showResultsRef.current.focus()
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      side="right"
      closeAtQuery={wideScreenQuery}
      aria-labelledby={titleId}
      className="w-full max-w-sm xl:hidden"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-4">
          <h2 id={titleId} className="text-base font-semibold text-slate-900">
            Filters
          </h2>
          <IconButton icon={X} label="Close filters" onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <FilterPanel {...panelProps} />
        </div>
        <div className="flex shrink-0 gap-2 border-t border-slate-200 p-4">
          {isFiltered && (
            <Button variant="secondary" onClick={handleClearAll}>
              Clear all
            </Button>
          )}
          <Button ref={showResultsRef} onClick={onClose} className="flex-1">
            Show {resultCount} {resultCount === 1 ? 'job' : 'jobs'}
          </Button>
        </div>
      </div>
    </Drawer>
  )
}
