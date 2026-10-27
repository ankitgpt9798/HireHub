// Up to two initials from a name, e.g. "Guest User" → "GU".
export function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}
