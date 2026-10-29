import { CHOICE_FILTERS, EMPTY_FILTERS, POSTED_WITHIN_OPTIONS, SALARY_OPTIONS } from './filterJobs.js'

// The URL search parameter for each filter. Groups with several choices repeat their
// parameter once per value: `?arrangement=remote&arrangement=hybrid&skill=React`.
export const FILTER_PARAMS = {
  workArrangements: 'arrangement',
  employmentTypes: 'type',
  experienceLevels: 'level',
  minSalary: 'salary',
  postedWithin: 'posted',
  skills: 'skill',
  skillMatch: 'match',
}

function optionValue(options, param) {
  return options.find((option) => String(option.value) === param)?.value ?? null
}

// Reads filters from URL search params. Values the app does not offer are ignored, so an
// edited or outdated link still opens. `skillNames` lists the skills that can be chosen;
// skills in the URL match them ignoring case. While the skills are not known yet (`skillNames`
// is null, for example before the listings load), every skill in the URL is kept as written.
export function filtersFromParams(params, skillNames) {
  const filters = { ...EMPTY_FILTERS }

  for (const [group, { labels }] of Object.entries(CHOICE_FILTERS)) {
    const chosen = new Set(params.getAll(FILTER_PARAMS[group]))
    // Display order, whatever order the URL lists them in.
    filters[group] = Object.keys(labels).filter((value) => chosen.has(value))
  }

  filters.minSalary = optionValue(SALARY_OPTIONS, params.get(FILTER_PARAMS.minSalary))
  filters.postedWithin = optionValue(POSTED_WITHIN_OPTIONS, params.get(FILTER_PARAMS.postedWithin))

  // Skills keep the order they were chosen in.
  const skillsByKey = new Map()
  for (const skill of skillNames ?? params.getAll(FILTER_PARAMS.skills)) {
    const key = skill.trim().toLowerCase()
    if (key && !skillsByKey.has(key)) skillsByKey.set(key, skill.trim())
  }
  const skills = params
    .getAll(FILTER_PARAMS.skills)
    .map((skill) => skillsByKey.get(skill.trim().toLowerCase()))
    .filter(Boolean)
  filters.skills = [...new Set(skills)]
  filters.skillMatch = params.get(FILTER_PARAMS.skillMatch) === 'any' ? 'any' : 'all'

  return filters
}

// Writes `filters` into `params` and returns it, leaving other parameters, such as the search
// query, as they are.
export function writeFiltersToParams(params, filters) {
  for (const name of Object.values(FILTER_PARAMS)) params.delete(name)

  for (const group of [...Object.keys(CHOICE_FILTERS), 'skills']) {
    for (const value of filters[group]) params.append(FILTER_PARAMS[group], value)
  }
  if (filters.minSalary != null) params.set(FILTER_PARAMS.minSalary, filters.minSalary)
  if (filters.postedWithin != null) params.set(FILTER_PARAMS.postedWithin, filters.postedWithin)
  if (filters.skillMatch === 'any') params.set(FILTER_PARAMS.skillMatch, 'any')

  return params
}
