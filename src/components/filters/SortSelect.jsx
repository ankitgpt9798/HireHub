import { ChevronDown } from 'lucide-react'
import { useId } from 'react'
import { SORT_OPTIONS } from '../../utils/sortJobs.js'

// A labelled select for the results' sort order. `onChange` receives the chosen value.
export default function SortSelect({ value, onChange }) {
  const selectId = useId()

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={selectId} className="text-sm whitespace-nowrap text-slate-600">
        Sort by
      </label>
      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white pr-9 pl-3 text-base font-medium text-slate-900 shadow-sm transition-colors hover:border-slate-400 sm:text-sm"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-500"
        />
      </div>
    </div>
  )
}
