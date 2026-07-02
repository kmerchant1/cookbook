// Shared prompt dialogs for stores, items, and tags — reused by Cook, Grocery,
// and Settings so store creation/editing looks identical everywhere.

import { useEffect, useState } from 'react'
import type { Hue } from '../types'
import { Dialog } from './Dialog'
import { HuePicker } from './primitives'

export function StoreDialog({
  open,
  title,
  initialName = '',
  initialHue = 'terra',
  submitLabel = 'Save',
  onSubmit,
  onClose,
  onDelete,
}: {
  open: boolean
  title: string
  initialName?: string
  initialHue?: Hue
  submitLabel?: string
  onSubmit: (name: string, hue: Hue) => void
  onClose: () => void
  onDelete?: () => void
}) {
  const [name, setName] = useState(initialName)
  const [hue, setHue] = useState<Hue>(initialHue)

  // Reset fields whenever the dialog (re)opens for a different store.
  useEffect(() => {
    if (open) {
      setName(initialName)
      setHue(initialHue)
    }
  }, [open, initialName, initialHue])

  const submit = () => {
    if (!name.trim()) return
    onSubmit(name.trim(), hue)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} label={title}>
      <div className="dialog-title">{title}</div>
      <div className="mono field-label" style={{ marginBottom: 8 }}>
        STORE NAME
      </div>
      <input
        className="field dialog-field"
        placeholder="e.g. Costco"
        value={name}
        autoFocus
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      <div className="mono field-label" style={{ marginBottom: 10 }}>
        COLOR
      </div>
      <div style={{ marginBottom: 18 }}>
        <HuePicker value={hue} onChange={setHue} />
      </div>
      <div className="dialog-actions">
        {onDelete ? (
          <button className="btn btn-danger" onClick={onDelete}>
            Delete
          </button>
        ) : (
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        )}
        <button className="btn btn-primary" onClick={submit}>
          {submitLabel}
        </button>
      </div>
    </Dialog>
  )
}

export function TagDialog({
  open,
  onSubmit,
  onClose,
}: {
  open: boolean
  onSubmit: (label: string, hue: Hue) => void
  onClose: () => void
}) {
  const [label, setLabel] = useState('')
  const [hue, setHue] = useState<Hue>('terra')

  useEffect(() => {
    if (open) {
      setLabel('')
      setHue('terra')
    }
  }, [open])

  const submit = () => {
    if (!label.trim()) return
    onSubmit(label.trim(), hue)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} label="New tag">
      <div className="dialog-title">New tag</div>
      <div className="mono field-label" style={{ marginBottom: 8 }}>
        TAG NAME
      </div>
      <input
        className="field dialog-field"
        placeholder="e.g. Vegetarian"
        value={label}
        autoFocus
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      <div className="mono field-label" style={{ marginBottom: 10 }}>
        COLOR
      </div>
      <div style={{ marginBottom: 18 }}>
        <HuePicker value={hue} onChange={setHue} />
      </div>
      <div className="dialog-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={submit}>
          Add
        </button>
      </div>
    </Dialog>
  )
}

export function ItemDialog({
  open,
  title = 'Add item',
  submitLabel = 'Add',
  initialName = '',
  initialQuantity = '',
  onSubmit,
  onClose,
  onDelete,
}: {
  open: boolean
  title?: string
  submitLabel?: string
  initialName?: string
  initialQuantity?: string
  onSubmit: (name: string, quantity: string) => void
  onClose: () => void
  onDelete?: () => void
}) {
  const [name, setName] = useState(initialName)
  const [quantity, setQuantity] = useState(initialQuantity)

  useEffect(() => {
    if (open) {
      setName(initialName)
      setQuantity(initialQuantity)
    }
  }, [open, initialName, initialQuantity])

  const submit = () => {
    if (!name.trim()) return
    onSubmit(name.trim(), quantity.trim())
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} label={title}>
      <div className="dialog-title">{title}</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <input
          className="ing-edit-q mono"
          style={{ width: 84 }}
          placeholder="qty"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <input
          className="ing-edit-n"
          placeholder="item"
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>
      <div className="dialog-actions">
        {onDelete ? (
          <button className="btn btn-danger" onClick={onDelete}>
            Delete
          </button>
        ) : (
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        )}
        <button className="btn btn-primary" onClick={submit}>
          {submitLabel}
        </button>
      </div>
    </Dialog>
  )
}
