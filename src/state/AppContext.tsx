import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import type { AppState } from '../types'
import { loadState, saveState } from '../lib/storage'
import { isSupabaseConfigured } from '../lib/supabase'
import type { Action } from './actions'
import { reducer } from './reducer'
import { applyAppearance, resolveTheme } from './theme'

interface AppContextValue {
  state: AppState
  dispatch: (action: Action) => void
  /** Resolved theme after applying the 'system' setting. */
  resolvedTheme: 'light' | 'dark'
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  // Persist every change (local-first). Swap this for a write-through repository
  // when Supabase sync is wired up.
  useEffect(() => {
    saveState(state)
  }, [state])

  // Apply + live-follow the appearance setting.
  useEffect(() => applyAppearance(state.appearance), [state.appearance])

  // Simulate the sync lifecycle so the Settings pill reflects real activity.
  // A configured Supabase project would replace this with actual write results.
  const dataSig = useMemo(
    () => JSON.stringify({ r: state.recipes, s: state.stores, t: state.tags }),
    [state.recipes, state.stores, state.tags],
  )
  const firstData = useRef(true)
  useEffect(() => {
    if (firstData.current) {
      firstData.current = false
      return
    }
    dispatch({ type: 'SET_SYNC_STATUS', status: 'syncing' })
    const id = setTimeout(() => {
      dispatch({ type: 'SET_SYNC_STATUS', status: 'synced', at: Date.now() })
    }, 650)
    return () => clearTimeout(id)
  }, [dataSig])

  // Give the first render a fresh "synced · just now" so the pill isn't empty.
  const mounted = useRef(false)
  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    if (state.lastSyncedAt == null) {
      dispatch({ type: 'SET_SYNC_STATUS', status: isSupabaseConfigured ? 'idle' : 'synced', at: Date.now() })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resolvedTheme = resolveTheme(state.appearance)

  // Re-resolve the theme label when 'system' flips (paint handles the DOM; this
  // just keeps `resolvedTheme` — used by a few JS-driven visuals — in sync).
  const [, force] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    if (state.appearance !== 'system' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => force()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [state.appearance])

  const value = useMemo<AppContextValue>(
    () => ({ state, dispatch, resolvedTheme }),
    [state, resolvedTheme],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within <AppProvider>')
  return ctx
}
