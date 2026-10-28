import { X } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '../ui/Button.jsx'

// Removable chips for the chosen filters (entries from `getActiveFilters`), plus "Clear all".
// Removing a chip moves focus to the next chip, or the previous one. When no chip is left,
// focus moves to `fallbackFocusRef`, because the chips and "Clear all" disappear.
export default function ActiveFilters({ activeFilters, onRemove, onClearAll, fallbackFocusRef }) {
  const listRef = useRef(null)

  function handleRemove(filter, index) {
    const chips = listRef.current.querySelectorAll('button')
    const nextFocus = chips[index + 1] ?? chips[index - 1]
    onRemove(filter)
    // Keyed chips keep their DOM nodes when another chip is removed, so this focus survives.
    if (nextFocus) nextFocus.focus()
    else fallbackFocusRef.current.focus()
  }

  function handleClearAll() {
    onClearAll()
    fallbackFocusRef.current.focus()
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <ul ref={listRef} aria-label="Active filters" className="flex flex-wrap gap-2">
        {activeFilters.map((filter, index) => (
          <li key={`${filter.group}:${filter.value}`}>
            <button
              type="button"
              onClick={() => handleRemove(filter, index)}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 py-1 pr-2 pl-3 text-sm font-medium text-brand-700 ring-1 ring-brand-200 transition-colors ring-inset hover:bg-brand-100"
            >
              <span className="sr-only">Remove filter:</span> {filter.label}
              <X aria-hidden="true" className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <Button variant="ghost" size="sm" onClick={handleClearAll}>
        Clear all
      </Button>
    </div>
  )
}
