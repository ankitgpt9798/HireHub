import { cn } from '../../utils/cn.js'

// Icon-only button; `label` is required because it is the button's accessible name.
// `iconClassName` adds classes to the icon, for example to spin it while something loads.
export function IconButton({ icon: Icon, label, className, iconClassName, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900',
        className,
      )}
      {...props}
    >
      <Icon aria-hidden="true" className={cn('size-5', iconClassName)} />
    </button>
  )
}
