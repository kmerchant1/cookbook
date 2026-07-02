// Bottom sheet with scrim + drag handle (README "Menus/sheets"). Dismisses on
// scrim tap or Escape. Constrained to the phone frame, not the whole viewport.

import { useEffect, type ReactNode } from 'react'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** aria label for the dialog */
  label?: string
}

export function Sheet({ open, onClose, children, label }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="scrim scrim-sheet" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grip" />
        {children}
      </div>
    </div>
  )
}
