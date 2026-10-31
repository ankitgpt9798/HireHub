import { cn } from '../../utils/cn.js'

// A grey placeholder block for content that is still loading. Its size comes from classes, for
// example `<Skeleton className="h-4 w-32" />`. It pulses unless reduced motion is requested.
// Skeletons are hidden from assistive technology, so whatever shows them should also say in
// words that content is loading.
export function Skeleton({ className }) {
  return (
    <span
      aria-hidden="true"
      className={cn('block rounded-md bg-slate-200 motion-safe:animate-pulse', className)}
    />
  )
}
