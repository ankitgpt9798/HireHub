import { Search, X } from 'lucide-react'
import { useId } from 'react'
import { IconButton } from '../ui/IconButton.jsx'

// A search landmark with a single search box. The parent owns the text and decides when to
// search: `onChange` runs on every keystroke, `onSearch` on Enter, and `onClear` from the
// clear button or Escape. `ref` points at the input so the parent can move focus to it.
export default function SearchBar({ ref, label, placeholder, value, onChange, onSearch, onClear }) {
  const inputId = useId()

  function handleSubmit(event) {
    event.preventDefault()
    onSearch(value)
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape' && value) {
      // Stop the browser's own clearing of search inputs so the parent's `onClear` runs instead.
      event.preventDefault()
      onClear()
    }
  }

  return (
    <form role="search" aria-label={label} onSubmit={handleSubmit} className="relative">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-slate-400"
      />
      <input
        ref={ref}
        id={inputId}
        type="search"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        className="h-12 w-full rounded-xl border border-slate-300 bg-white pr-12 pl-11 text-base text-slate-900 shadow-sm transition-colors placeholder:text-slate-500 hover:border-slate-400 focus-visible:border-brand-500 sm:text-sm [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <IconButton
          icon={X}
          label="Clear search"
          onClick={onClear}
          className="absolute top-1/2 right-1 -translate-y-1/2"
        />
      )}
    </form>
  )
}
