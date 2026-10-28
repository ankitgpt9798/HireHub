import { useEffect, useRef } from 'react'
import { cn } from '../../utils/cn.js'

const sideClasses = {
  left: 'mr-auto',
  right: 'ml-auto',
}

// Full-height slide-over built on a native modal <dialog>, so the browser handles focus
// containment, Escape, and making the page behind it inert. Its content renders only while
// it is open. Give it an accessible name with `aria-label` or `aria-labelledby`.
//
// Hide the drawer with a responsive class (such as `lg:hidden`) where another layout takes
// over, and pass that breakpoint as `closeAtQuery`: an open modal would otherwise block the
// page invisibly once the viewport grows past it.
export function Drawer({ isOpen, onClose, side = 'left', closeAtQuery, className, children, ...props }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (isOpen && !dialog.open) dialog.showModal()
    if (!isOpen && dialog.open) dialog.close()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !closeAtQuery || !window.matchMedia) return undefined
    const mediaQuery = window.matchMedia(closeAtQuery)
    function handleChange(event) {
      if (event.matches) onClose()
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [isOpen, closeAtQuery, onClose])

  function handleCancel(event) {
    // Escape: keep React state in charge of closing.
    event.preventDefault()
    onClose()
  }

  function handleBackdropClick(event) {
    // Clicks on the content land on child elements; only the backdrop targets the dialog itself.
    if (event.target === event.currentTarget) onClose()
  }

  return (
    // Backdrop clicks are a pointer convenience; keyboard users close with Escape or a close button.
    // eslint-disable-next-line jsx-a11y-x/click-events-have-key-events, jsx-a11y-x/no-noninteractive-element-interactions
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className={cn(
        'm-0 h-dvh max-h-dvh border-0 bg-white p-0 shadow-xl backdrop:bg-slate-900/50',
        sideClasses[side],
        className,
      )}
      {...props}
    >
      {isOpen && children}
    </dialog>
  )
}
