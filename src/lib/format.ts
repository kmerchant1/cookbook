// Small display helpers.

/** Mono "JUST NOW" / "3 MIN AGO" label for the sync pill. */
export function relativeSyncLabel(at: number | null): string {
  if (at == null) return '—'
  const secs = Math.max(0, Math.round((Date.now() - at) / 1000))
  if (secs < 45) return 'JUST NOW'
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins} MIN AGO`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} HR AGO`
  const days = Math.round(hrs / 24)
  return `${days} DAY${days === 1 ? '' : 'S'} AGO`
}

/** "40 MIN" from a minutes number. */
export function minutesToDisplay(mins: number): string {
  return mins > 0 ? `${mins} MIN` : ''
}

/** "4 SERVES" from a servings number. */
export function servingsToDisplay(n: number): string {
  return `${n} SERVE${n === 1 ? '' : 'S'}`
}

/** Parse a stored "40 MIN" display string back to a number (best effort). */
export function displayToMinutes(time: string): number {
  const m = /(\d+)/.exec(time)
  if (!m) return 0
  const n = parseInt(m[1], 10)
  return /h/i.test(time) ? n * 60 : n
}

/** Parse "4 SERVES" back to a number. */
export function displayToServings(serves: string): number {
  const m = /(\d+)/.exec(serves)
  return m ? parseInt(m[1], 10) : 2
}

/**
 * Photo placeholder tints are stored as light-mode creams. In dark mode, mix
 * them 72% toward the warm near-black app bg so the striped drop-zones sit
 * quietly in the dark UI (matching the design's dark photo tints). Real
 * user photos replace these in production.
 */
export function darkPhotoTint(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const mix = (c: number, base: number) => Math.round(c * 0.28 + base * 0.72)
  const to2 = (v: number) => v.toString(16).padStart(2, '0')
  return `#${to2(mix(r, 27))}${to2(mix(g, 25))}${to2(mix(b, 22))}`
}

/** Pull the initials for an avatar ("Sam Rivera" → "SR"). */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}
