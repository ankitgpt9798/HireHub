import { useId } from 'react'

// A titled group of filter controls, with an optional note under the title.
export function FilterGroup({ title, description, children }) {
  const descriptionId = useId()

  return (
    <div className="p-4">
      <fieldset aria-describedby={description ? descriptionId : undefined}>
        <legend className="text-sm font-semibold text-slate-900">{title}</legend>
        {description && (
          <p id={descriptionId} className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        )}
        <div className="mt-2 space-y-0.5">{children}</div>
      </fieldset>
    </div>
  )
}

// A checkbox or radio button with its label and, when given, the number of jobs it would show.
export function FilterOption({ type = 'checkbox', name, label, count, checked, onChange }) {
  return (
    <label className="-mx-2 flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className="size-4 shrink-0 accent-brand-600"
      />
      <span className="min-w-0 flex-1">{label}</span>{' '}
      {count != null && (
        <span className="text-xs text-slate-500 tabular-nums">
          {count} <span className="sr-only">{count === 1 ? 'job' : 'jobs'}</span>
        </span>
      )}
    </label>
  )
}
