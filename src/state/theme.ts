// Applies the Appearance setting to the document. 'system' follows the OS via
// prefers-color-scheme and keeps following it live. Returns a cleanup for the
// media listener so the provider can re-subscribe when the setting changes.

import type { Appearance } from '../types'

const media = () =>
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null

export function resolveTheme(appearance: Appearance): 'light' | 'dark' {
  if (appearance === 'system') {
    return media()?.matches ? 'dark' : 'light'
  }
  return appearance
}

function paint(theme: 'light' | 'dark') {
  const root = document.documentElement
  root.dataset.theme = theme
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#1b1916' : '#faf6f0')
}

export function applyAppearance(appearance: Appearance): () => void {
  paint(resolveTheme(appearance))

  if (appearance === 'system') {
    const mq = media()
    if (mq) {
      const onChange = () => paint(mq.matches ? 'dark' : 'light')
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    }
  }
  return () => {}
}
