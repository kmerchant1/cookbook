// Local persistence. v1 is local-first (README build order step 1): the whole
// AppState is serialized to localStorage on every change. The load/save seam
// here is where a Supabase-backed repository slots in later (step 2) — keep
// reads/writes going through these functions, not localStorage directly.

import type { AppState } from '../types'
import { makeSeedState } from './seed'

const KEY = 'cookbook.state.v1'
const APPEARANCE_KEY = 'cookbook.appearance' // read early (pre-React) to avoid FOUC

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      const seeded = makeSeedState()
      saveState(seeded)
      return seeded
    }
    const parsed = JSON.parse(raw) as AppState
    // Shallow-heal missing top-level keys so older payloads don't crash the app.
    return { ...makeSeedState(), ...parsed }
  } catch {
    return makeSeedState()
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
    localStorage.setItem(APPEARANCE_KEY, state.appearance)
  } catch {
    // Quota or private-mode failures are non-fatal — the app keeps working in memory.
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

/** Read the persisted appearance before React mounts (used in main.tsx). */
export function readAppearanceEarly(): 'light' | 'dark' | 'system' {
  try {
    const v = localStorage.getItem(APPEARANCE_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* ignore */
  }
  return 'system'
}
