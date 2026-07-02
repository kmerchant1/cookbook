// Screen 6 — Settings. Account + live sync pill, store manager, tag manager,
// appearance toggle (Light · Dark · System), sign out. (README §6)

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import type { Appearance, Store, Tag } from '../types'
import { initials, relativeSyncLabel } from '../lib/format'
import { isSupabaseConfigured } from '../lib/supabase'
import { StatusBar } from '../components/StatusBar'
import { TabBar } from '../components/TabBar'
import { StoreDialog, TagDialog } from '../components/prompts'
import { ConfirmDialog } from '../components/Dialog'
import { ChevronRight, MoonIcon, PlusIcon, SunIcon } from '../components/Icons'
import { Chip, StoreDot } from '../components/primitives'

const SYNC_COPY: Record<string, string> = {
  synced: 'All changes synced',
  syncing: 'Syncing changes…',
  idle: isSupabaseConfigured ? 'Ready to sync' : 'Saved on this device',
  offline: 'Offline — saved locally',
  error: 'Sync error — retrying',
}

export function SettingsScreen() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const [addStoreOpen, setAddStoreOpen] = useState(false)
  const [editStore, setEditStore] = useState<Store | null>(null)
  const [confirmDeleteStore, setConfirmDeleteStore] = useState<Store | null>(null)
  const [addTagOpen, setAddTagOpen] = useState(false)
  const [confirmDeleteTag, setConfirmDeleteTag] = useState<Tag | null>(null)
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  const { account, syncStatus, lastSyncedAt } = state
  const syncMeta = syncStatus === 'syncing' ? 'NOW' : relativeSyncLabel(lastSyncedAt)

  return (
    <div className="screen">
      <StatusBar />
      <div className="screen-scroll">
        <header className="screen-header">
          <div className="screen-title">Settings</div>
        </header>

        <div className="settings-body">
          {/* Account + sync */}
          <div className="account-card">
            <div className="account-row">
              <div className="avatar">{initials(account.name)}</div>
              <div className="spacer">
                <div className="account-name">{account.name}</div>
                <div className="account-email">{account.email}</div>
              </div>
            </div>
            <div className="sync-pill">
              <span className={`sync-dot sync-dot-${syncStatus} ${syncStatus === 'synced' ? 'sync-dot-pulse' : ''}`} />
              <span className="sync-text">{SYNC_COPY[syncStatus] ?? SYNC_COPY.synced}</span>
              <span className="mono sync-meta">{syncMeta}</span>
            </div>
          </div>

          {/* Stores */}
          <div>
            <div className="mono field-label settings-group-label">YOUR STORES</div>
            <div className="settings-card">
              {state.stores.map((store) => (
                <button key={store.id} className="settings-row" onClick={() => setEditStore(store)}>
                  <StoreDot hue={store.hue} />
                  <span className="settings-row-name">{store.name}</span>
                  <span className="mono settings-row-count">{store.items.length}</span>
                  <span className="chev">
                    <ChevronRight size={16} />
                  </span>
                </button>
              ))}
              <button className="settings-add" onClick={() => setAddStoreOpen(true)}>
                <PlusIcon size={16} strokeWidth={2.4} />
                Add a store
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="mono field-label settings-group-label">TAGS</div>
            <div className="tags-card">
              {state.tags.map((tag) => (
                <button key={tag.id} onClick={() => setConfirmDeleteTag(tag)} style={{ background: 'none' }}>
                  <Chip label={tag.label} hue={tag.hue} size="md" />
                </button>
              ))}
              <button className="dashed-add" onClick={() => setAddTagOpen(true)}>
                <PlusIcon size={12} strokeWidth={2.6} />
                New
              </button>
            </div>
          </div>

          {/* Appearance */}
          <div>
            <div className="mono field-label settings-group-label">APPEARANCE</div>
            <div className="appearance-toggle">
              <AppearanceButton
                value="light"
                current={state.appearance}
                onSelect={(a) => dispatch({ type: 'SET_APPEARANCE', appearance: a })}
                icon={<span className="sun"><SunIcon /></span>}
                label="Light"
              />
              <AppearanceButton
                value="dark"
                current={state.appearance}
                onSelect={(a) => dispatch({ type: 'SET_APPEARANCE', appearance: a })}
                icon={<span className="moon"><MoonIcon /></span>}
                label="Dark"
              />
              <AppearanceButton
                value="system"
                current={state.appearance}
                onSelect={(a) => dispatch({ type: 'SET_APPEARANCE', appearance: a })}
                label="System"
              />
            </div>
          </div>

          <button className="sign-out" onClick={() => setConfirmSignOut(true)}>
            Sign out
          </button>
        </div>
      </div>

      {/* dialogs */}
      <StoreDialog
        open={addStoreOpen}
        title="New store"
        submitLabel="Create"
        onClose={() => setAddStoreOpen(false)}
        onSubmit={(name, hue) => dispatch({ type: 'ADD_STORE', name, hue })}
      />
      <StoreDialog
        open={!!editStore}
        title="Edit store"
        initialName={editStore?.name ?? ''}
        initialHue={editStore?.hue ?? 'terra'}
        onClose={() => setEditStore(null)}
        onSubmit={(name, hue) => {
          if (editStore) {
            dispatch({ type: 'RENAME_STORE', id: editStore.id, name })
            dispatch({ type: 'SET_STORE_HUE', id: editStore.id, hue })
          }
        }}
        onDelete={() => {
          setConfirmDeleteStore(editStore)
          setEditStore(null)
        }}
      />
      <ConfirmDialog
        open={!!confirmDeleteStore}
        title="Delete store?"
        message={confirmDeleteStore ? `"${confirmDeleteStore.name}" and its items will be removed.` : ''}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (confirmDeleteStore) dispatch({ type: 'DELETE_STORE', id: confirmDeleteStore.id })
          setConfirmDeleteStore(null)
        }}
        onCancel={() => setConfirmDeleteStore(null)}
      />
      <TagDialog
        open={addTagOpen}
        onClose={() => setAddTagOpen(false)}
        onSubmit={(label, hue) => dispatch({ type: 'ADD_TAG', label, hue })}
      />
      <ConfirmDialog
        open={!!confirmDeleteTag}
        title="Delete tag?"
        message={confirmDeleteTag ? `"${confirmDeleteTag.label}" will be removed from all recipes.` : ''}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (confirmDeleteTag) dispatch({ type: 'DELETE_TAG', id: confirmDeleteTag.id })
          setConfirmDeleteTag(null)
        }}
        onCancel={() => setConfirmDeleteTag(null)}
      />
      <ConfirmDialog
        open={confirmSignOut}
        title="Sign out?"
        message={
          isSupabaseConfigured
            ? 'You will be signed out of your account on this device.'
            : 'This resets the local demo data on this device back to the sample cookbook.'
        }
        confirmLabel="Sign out"
        destructive
        onConfirm={() => {
          dispatch({ type: 'SIGN_OUT' })
          setConfirmSignOut(false)
          navigate('/recipes')
        }}
        onCancel={() => setConfirmSignOut(false)}
      />

      <TabBar />
    </div>
  )
}

function AppearanceButton({
  value,
  current,
  onSelect,
  icon,
  label,
}: {
  value: Appearance
  current: Appearance
  onSelect: (a: Appearance) => void
  icon?: React.ReactNode
  label: string
}) {
  return (
    <button
      className={`appearance-item ${current === value ? 'appearance-item-on' : ''}`}
      onClick={() => onSelect(value)}
    >
      {icon}
      {label}
    </button>
  )
}
