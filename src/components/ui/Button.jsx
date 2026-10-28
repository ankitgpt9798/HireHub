import { Link } from 'react-router'
import { cn } from '../../utils/cn.js'

const baseClasses =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50'

const variantClasses = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700',
  secondary:
    'border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
}

const sizeClasses = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-4 text-sm',
}

function buttonClasses(variant, size, className) {
  return cn(baseClasses, variantClasses[variant], sizeClasses[size], className)
}

export function Button({ variant = 'primary', size = 'md', type = 'button', className, ...props }) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />
}

// A router link styled as a button, for actions that navigate.
export function ButtonLink({ variant = 'primary', size = 'md', className, ...props }) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />
}
