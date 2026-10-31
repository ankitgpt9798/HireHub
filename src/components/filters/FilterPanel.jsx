import { useId } from 'react'
import { Skeleton } from '../feedback/Skeleton.jsx'
import {
  CHOICE_FILTERS,
  HOURS_PER_YEAR,
  POSTED_WITHIN_OPTIONS,
  SALARY_OPTIONS,
  toggleFilterValue,
} from '../../utils/filterJobs.js'
import { FilterGroup, FilterOption } from './FilterOptions.jsx'
import SkillFilter from './SkillFilter.jsx'

// A radio group for a filter with one choice at a time, starting with an "any" option.
function SingleChoiceFilter({ title, description, group, anyLabel, options, filters, counts, onChange }) {
  const name = useId()

  function choose(value) {
    onChange((current) => ({ ...current, [group]: value }))
  }

  return (
    <FilterGroup title={title} description={description}>
      <FilterOption
        type="radio"
        name={name}
        label={anyLabel}
        checked={filters[group] == null}
        onChange={() => choose(null)}
      />
      {options.map(({ value, label }) => (
        <FilterOption
          key={value}
          type="radio"
          name={name}
          label={label}
          count={counts[group][value]}
          checked={filters[group] === value}
          onChange={() => choose(value)}
        />
      ))}
    </FilterGroup>
  )
}

// Every filter control. Changes apply straight away: `onChange` receives a function from the
// current filters to the new ones. `counts` comes from `getFilterCounts`, and `skillOptions`
// lists the skills to offer, most common first.
export default function FilterPanel({ filters, counts, skillOptions, onChange }) {
  return (
    <div className="divide-y divide-slate-200">
      {Object.entries(CHOICE_FILTERS).map(([group, { title, labels }]) => (
        <FilterGroup key={group} title={title}>
          {Object.entries(labels).map(([value, label]) => (
            <FilterOption
              key={value}
              label={label}
              count={counts[group][value] ?? 0}
              checked={filters[group].includes(value)}
              onChange={() => onChange((current) => toggleFilterValue(current, group, value))}
            />
          ))}
        </FilterGroup>
      ))}

      <SingleChoiceFilter
        title="Salary"
        description={`Yearly pay. Hourly rates count as full-time (${HOURS_PER_YEAR.toLocaleString('en-US')} hours), and listings without a salary are left out.`}
        group="minSalary"
        anyLabel="Any salary"
        options={SALARY_OPTIONS}
        filters={filters}
        counts={counts}
        onChange={onChange}
      />
      <SingleChoiceFilter
        title="Date posted"
        group="postedWithin"
        anyLabel="Any time"
        options={POSTED_WITHIN_OPTIONS}
        filters={filters}
        counts={counts}
        onChange={onChange}
      />

      <SkillFilter
        skillOptions={skillOptions}
        selected={filters.skills}
        skillMatch={filters.skillMatch}
        counts={counts.skills}
        onChange={onChange}
      />
    </div>
  )
}

// Placeholder groups of options in the panel's layout, for while the listings load. Hidden from
// assistive technology; the page says in words that the listings are loading.
export function FilterPanelSkeleton() {
  return (
    <div aria-hidden="true" className="divide-y divide-slate-200">
      {[3, 4, 4, 5].map((optionCount, group) => (
        <div key={group} className="p-4">
          <Skeleton className="my-[3px] h-3.5 w-28" />
          <div className="mt-2 space-y-0.5">
            {Array.from({ length: optionCount }, (_, option) => (
              <div key={option} className="flex h-8 items-center gap-3">
                <Skeleton className="size-4 shrink-0 rounded" />
                <Skeleton className={option % 2 ? 'h-3.5 w-24' : 'h-3.5 w-16'} />
                <Skeleton className="ml-auto h-3 w-4" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
