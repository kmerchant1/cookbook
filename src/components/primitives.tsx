// Small shared visual primitives used across screens: tag chips, store dots,
// checkboxes, the striped photo placeholder, and the hue picker. All hue-driven
// colors come from CSS variables via `hue-*` classes so they flip with the theme.

import type { Hue, Tag } from '../types'
import { darkPhotoTint } from '../lib/format'
import { useApp } from '../state/AppContext'
import { CheckIcon, XIcon } from './Icons'

export function hueClass(hue: Hue): string {
  return `hue-${hue}`
}

export function Chip({
  label,
  hue,
  onRemove,
  filled = false,
  size = 'sm',
}: {
  label: string
  hue: Hue
  onRemove?: () => void
  /** filled = solid accent (active filter tag) vs tinted (default chip) */
  filled?: boolean
  size?: 'sm' | 'md'
}) {
  return (
    <span className={`chip ${hueClass(hue)} ${filled ? 'chip-filled' : ''} chip-${size}`}>
      {label}
      {onRemove && (
        <button className="chip-x" aria-label={`Remove ${label}`} onClick={onRemove}>
          <XIcon size={12} />
        </button>
      )}
    </span>
  )
}

export function TagChip({ tag, ...rest }: { tag: Tag; onRemove?: () => void; filled?: boolean; size?: 'sm' | 'md' }) {
  return <Chip label={tag.label} hue={tag.hue} {...rest} />
}

export function StoreDot({ hue }: { hue: Hue }) {
  return <span className={`dot ${hueClass(hue)}`} />
}

export function Checkbox({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean
  onChange: () => void
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`checkbox ${checked ? 'checkbox-on' : ''}`}
      onClick={onChange}
    >
      {checked && <CheckIcon size={14} />}
    </button>
  )
}

export function PhotoPlaceholder({
  bg,
  radius = 16,
  caption = 'PHOTO',
  hero = false,
  children,
}: {
  bg: string
  radius?: number
  caption?: string
  hero?: boolean
  children?: React.ReactNode
}) {
  const { resolvedTheme } = useApp()
  const shownBg = resolvedTheme === 'dark' ? darkPhotoTint(bg) : bg
  return (
    <div
      className={`photo ${hero ? 'photo-hero' : ''}`}
      style={{ background: shownBg, borderRadius: hero ? 0 : radius }}
    >
      <div className="photo-stripe" />
      <div className="photo-caption mono">{caption}</div>
      {children}
    </div>
  )
}

const HUES: { hue: Hue; label: string }[] = [
  { hue: 'terra', label: 'Terracotta' },
  { hue: 'green', label: 'Forest' },
  { hue: 'amber', label: 'Amber' },
  { hue: 'neutral', label: 'Neutral' },
]

export function HuePicker({ value, onChange }: { value: Hue; onChange: (h: Hue) => void }) {
  return (
    <div className="hue-picker">
      {HUES.map(({ hue, label }) => (
        <button
          key={hue}
          type="button"
          aria-label={label}
          aria-pressed={value === hue}
          className={`hue-swatch ${hueClass(hue)} ${value === hue ? 'hue-swatch-on' : ''}`}
          onClick={() => onChange(hue)}
        >
          {value === hue && <CheckIcon size={12} />}
        </button>
      ))}
    </div>
  )
}
