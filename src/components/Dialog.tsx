// Centered modal dialog (used for add/rename store, add item, add tag, confirms).
// Scrim + Escape dismiss, scoped to the phone frame. ConfirmDialog is a thin
// wrapper for destructive "are you sure?" prompts (delete recipe/store, sign out).

import { useEffect, type ReactNode } from 'react'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  label?: string
}

export function Dialog({ open, onClose, children, label }: DialogProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="scrim scrim-center" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

interface ConfirmDialogProps {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} label={title}>
      <div className="dialog-title">{title}</div>
      {message && <div className="dialog-message">{message}</div>}
      <div className="dialog-actions">
        <button className="btn btn-ghost" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button
          className={`btn ${destructive ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  )
}
