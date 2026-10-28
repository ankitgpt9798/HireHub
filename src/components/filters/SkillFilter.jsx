import { useId, useState } from 'react'
import { toggleFilterValue } from '../../utils/filterJobs.js'
import { normalizeText } from '../../utils/normalizeText.js'
import { FilterGroup, FilterOption } from './FilterOptions.jsx'

// How many of the most common skills show before "Show all skills".
const POPULAR_SKILL_COUNT = 10

// Skill checkboxes with a box to find a skill by name. Until "Show all" is chosen, only the most
// common skills show, plus any that are already chosen. With two or more skills chosen, the
// user picks whether jobs need all of them or any of them.
export default function SkillFilter({ skillOptions, selected, skillMatch, counts, onChange }) {
  const [finderText, setFinderText] = useState('')
  const [showAll, setShowAll] = useState(false)
  const finderId = useId()
  const listId = useId()
  const matchName = useId()

  const term = normalizeText(finderText.trim())
  let visibleSkills
  if (term) {
    visibleSkills = skillOptions.filter((skill) => normalizeText(skill).includes(term))
  } else if (showAll) {
    visibleSkills = skillOptions
  } else {
    visibleSkills = skillOptions.filter(
      (skill, index) => index < POPULAR_SKILL_COUNT || selected.includes(skill),
    )
  }

  function handleFinderKeyDown(event) {
    if (event.key === 'Escape' && finderText) {
      // Clear the box without the Escape also closing the filters drawer around it.
      event.preventDefault()
      setFinderText('')
    }
  }

  function setSkillMatch(value) {
    onChange((current) => ({ ...current, skillMatch: value }))
  }

  return (
    <FilterGroup title="Skills">
      <label htmlFor={finderId} className="sr-only">
        Find a skill
      </label>
      <input
        id={finderId}
        type="search"
        value={finderText}
        placeholder="Find a skill"
        autoComplete="off"
        onChange={(event) => setFinderText(event.target.value)}
        onKeyDown={handleFinderKeyDown}
        className="mb-2 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-500 hover:border-slate-400 focus-visible:border-brand-500"
      />

      <div id={listId} className="space-y-0.5">
        {visibleSkills.map((skill) => (
          <FilterOption
            key={skill}
            label={skill}
            count={counts[skill] ?? 0}
            checked={selected.includes(skill)}
            onChange={() => onChange((current) => toggleFilterValue(current, 'skills', skill))}
          />
        ))}
      </div>
      {term && visibleSkills.length === 0 && (
        <p className="py-1.5 text-sm text-slate-500">No skills match “{finderText.trim()}”.</p>
      )}

      {!term && skillOptions.length > POPULAR_SKILL_COUNT && (
        <button
          type="button"
          aria-expanded={showAll}
          aria-controls={listId}
          onClick={() => setShowAll(!showAll)}
          className="mt-1 rounded text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline"
        >
          {showAll ? 'Show fewer skills' : `Show all ${skillOptions.length} skills`}
        </button>
      )}

      {selected.length >= 2 && (
        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
          <fieldset>
            <legend className="text-xs font-medium text-slate-600">Show jobs that list</legend>
            <div className="mt-1 space-y-0.5">
              <FilterOption
                type="radio"
                name={matchName}
                label="All selected skills"
                checked={skillMatch === 'all'}
                onChange={() => setSkillMatch('all')}
              />
              <FilterOption
                type="radio"
                name={matchName}
                label="Any selected skill"
                checked={skillMatch === 'any'}
                onChange={() => setSkillMatch('any')}
              />
            </div>
          </fieldset>
        </div>
      )}
    </FilterGroup>
  )
}
