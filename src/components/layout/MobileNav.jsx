import { X } from 'lucide-react'
import { Drawer } from '../ui/Drawer.jsx'
import { IconButton } from '../ui/IconButton.jsx'
import BrandLogo from './BrandLogo.jsx'
import DemoDataNotice from './DemoDataNotice.jsx'
import PrimaryNav from './PrimaryNav.jsx'

// Matches Tailwind's `lg` breakpoint, where the sidebar takes over.
const desktopQuery = '(min-width: 64rem)'

// Slide-over menu for screens below `lg`.
export default function MobileNav({ isOpen, onClose }) {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      closeAtQuery={desktopQuery}
      aria-label="Navigation menu"
      className="w-72 max-w-[85vw] lg:hidden"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-4">
          <BrandLogo onClick={onClose} />
          <IconButton icon={X} label="Close navigation menu" onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <PrimaryNav onNavigate={onClose} />
        </div>
        <div className="p-4">
          <DemoDataNotice />
        </div>
      </div>
    </Drawer>
  )
}
