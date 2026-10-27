import { cn } from '../../utils/cn.js'
import { getInitials } from '../../utils/getInitials.js'

const colorClasses = [
  'bg-sky-100 text-sky-800',
  'bg-emerald-100 text-emerald-800',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-800',
  'bg-violet-100 text-violet-800',
  'bg-teal-100 text-teal-800',
  'bg-orange-100 text-orange-800',
  'bg-indigo-100 text-indigo-800',
]

// The same company name always maps to the same color.
function getColorClasses(name) {
  let hash = 0
  for (const character of name) {
    hash = (hash * 31 + character.codePointAt(0)) >>> 0
  }
  return colorClasses[hash % colorClasses.length]
}

// Initials placeholder for a company logo. It is decorative: show the company name as text next to it.
export default function CompanyLogo({ name, className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-sm font-semibold',
        getColorClasses(name),
        className,
      )}
    >
      {getInitials(name)}
    </span>
  )
}
