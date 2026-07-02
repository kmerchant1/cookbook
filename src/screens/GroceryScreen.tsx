// Screen 5 — Grocery Lists. One collapsible card per store; drag-reorderable,
// checkable items; per-store add / clear-checked; store rename & delete. Done
// items show filled-forest + strikethrough. (README §5)

import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '../state/AppContext'
import type { GroceryItem, Store } from '../types'
import { StatusBar } from '../components/StatusBar'
import { TabBar } from '../components/TabBar'
import { ItemDialog, StoreDialog } from '../components/prompts'
import { ConfirmDialog } from '../components/Dialog'
import { ChevronRight, DragHandleIcon, PlusIcon } from '../components/Icons'
import { Checkbox, StoreDot } from '../components/primitives'

export function GroceryScreen() {
  const { state, dispatch } = useApp()
  const [addStoreOpen, setAddStoreOpen] = useState(false)

  const totalItems = state.stores.reduce((sum, s) => sum + s.items.length, 0)

  return (
    <div className="screen">
      <StatusBar />
      <div className="screen-scroll">
        <header className="screen-header">
          <div>
            <div className="screen-title">Grocery</div>
            <div className="mono mono-count">
              {totalItems} ITEMS · {state.stores.length} STORE{state.stores.length === 1 ? '' : 'S'}
            </div>
          </div>
          <button
            className="round-btn round-btn-surface"
            aria-label="Add store"
            onClick={() => setAddStoreOpen(true)}
          >
            <PlusIcon size={21} strokeWidth={2} />
          </button>
        </header>

        {state.stores.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: 40 }}>
            <div className="empty-title">No lists yet</div>
            <div className="empty-sub">
              Add a store, or combine recipes in Cook to build a sorted list.
            </div>
            <button className="btn btn-primary btn-block" onClick={() => setAddStoreOpen(true)}>
              Add a store
            </button>
          </div>
        ) : (
          <div className="grocery-list">
            {state.stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}
      </div>

      <StoreDialog
        open={addStoreOpen}
        title="New store"
        submitLabel="Create"
        onClose={() => setAddStoreOpen(false)}
        onSubmit={(name, hue) => dispatch({ type: 'ADD_STORE', name, hue })}
      />
      <TabBar />
    </div>
  )
}

const sortedIds = (items: GroceryItem[]) =>
  [...items].sort((a, b) => a.sortOrder - b.sortOrder).map((i) => i.id)

function StoreCard({ store }: { store: Store }) {
  const { dispatch } = useApp()
  const [collapsed, setCollapsed] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<GroceryItem | null>(null)
  const [renameOpen, setRenameOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Optimistic order for smooth drag; resynced from props when not dragging.
  const [order, setOrder] = useState<string[]>(() => sortedIds(store.items))
  const orderRef = useRef(order)
  orderRef.current = order
  const [dragId, setDragId] = useState<string | null>(null)
  const draggingId = useRef<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!draggingId.current) setOrder(sortedIds(store.items))
  }, [store.items])

  const onMove = useCallback((e: PointerEvent) => {
    const id = draggingId.current
    const container = listRef.current
    if (!id || !container) return
    const rows = [...container.querySelectorAll('[data-item-id]')].filter(
      (el) => el.getAttribute('data-item-id') !== id,
    ) as HTMLElement[]
    let insert = rows.length
    for (let i = 0; i < rows.length; i++) {
      const rect = rows[i].getBoundingClientRect()
      if (e.clientY < rect.top + rect.height / 2) {
        insert = i
        break
      }
    }
    const next = orderRef.current.filter((x) => x !== id)
    next.splice(insert, 0, id)
    if (next.join('|') !== orderRef.current.join('|')) setOrder(next)
  }, [])

  const onUp = useCallback(() => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    const finalOrder = orderRef.current
    draggingId.current = null
    setDragId(null)
    dispatch({ type: 'SET_ITEM_ORDER', storeId: store.id, orderedIds: finalOrder })
  }, [dispatch, onMove, store.id])

  const startDrag = (e: React.PointerEvent, id: string) => {
    e.preventDefault()
    draggingId.current = id
    setDragId(id)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  useEffect(
    () => () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    },
    [onMove, onUp],
  )

  const itemsById = new Map(store.items.map((i) => [i.id, i]))
  const orderedItems = order.map((id) => itemsById.get(id)).filter((i): i is GroceryItem => Boolean(i))
  const checkedCount = store.items.filter((i) => i.done).length

  return (
    <div className="store-card">
      <button
        className={`store-card-head ${collapsed ? 'collapsed' : ''}`}
        onClick={() => setCollapsed((c) => !c)}
      >
        <StoreDot hue={store.hue} />
        <span className="store-card-name">{store.name}</span>
        <span className="mono store-card-count">{store.items.length} ITEMS</span>
        <span
          className={`chev ${collapsed ? '' : 'chev-open'}`}
          role="button"
          tabIndex={-1}
          aria-label="Edit store"
          onClick={(e) => {
            e.stopPropagation()
            setRenameOpen(true)
          }}
        >
          <ChevronRight size={17} />
        </span>
      </button>

      {!collapsed && (
        <>
          <div ref={listRef}>
            {orderedItems.map((item) => (
              <div
                key={item.id}
                data-item-id={item.id}
                className={`item-row ${item.done ? 'row-done' : ''} ${dragId === item.id ? 'dragging' : ''}`}
              >
                <span
                  className="drag-handle"
                  aria-label="Drag to reorder"
                  onPointerDown={(e) => startDrag(e, item.id)}
                >
                  <DragHandleIcon size={15} />
                </span>
                <Checkbox
                  checked={item.done}
                  onChange={() => dispatch({ type: 'TOGGLE_ITEM_DONE', storeId: store.id, itemId: item.id })}
                  ariaLabel={item.name}
                />
                <button
                  className="item-name"
                  style={{ background: 'none', textAlign: 'left' }}
                  onClick={() => setEditItem(item)}
                >
                  {item.name}
                </button>
                <span className="mono item-q">{item.quantity}</span>
              </div>
            ))}

            <button className="add-item-row" onClick={() => setAddOpen(true)}>
              <PlusIcon size={15} strokeWidth={2.2} />
              Add item
            </button>
          </div>

          {checkedCount > 0 && (
            <div className="store-card-tools">
              <button
                className="store-tool"
                onClick={() => dispatch({ type: 'CLEAR_CHECKED', storeId: store.id })}
              >
                Clear {checkedCount} checked
              </button>
            </div>
          )}
        </>
      )}

      <ItemDialog
        open={addOpen}
        title={`Add to ${store.name}`}
        onClose={() => setAddOpen(false)}
        onSubmit={(name, quantity) => dispatch({ type: 'ADD_ITEM', storeId: store.id, name, quantity })}
      />

      <ItemDialog
        open={!!editItem}
        title="Edit item"
        submitLabel="Save"
        initialName={editItem?.name ?? ''}
        initialQuantity={editItem?.quantity ?? ''}
        onClose={() => setEditItem(null)}
        onSubmit={(name, quantity) => {
          if (editItem) dispatch({ type: 'UPDATE_ITEM', storeId: store.id, itemId: editItem.id, name, quantity })
        }}
        onDelete={() => {
          if (editItem) dispatch({ type: 'DELETE_ITEM', storeId: store.id, itemId: editItem.id })
          setEditItem(null)
        }}
      />

      <StoreDialog
        open={renameOpen}
        title="Edit store"
        initialName={store.name}
        initialHue={store.hue}
        onClose={() => setRenameOpen(false)}
        onSubmit={(name, hue) => {
          dispatch({ type: 'RENAME_STORE', id: store.id, name })
          dispatch({ type: 'SET_STORE_HUE', id: store.id, hue })
        }}
        onDelete={() => {
          setRenameOpen(false)
          setConfirmDelete(true)
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete store?"
        message={`"${store.name}" and its ${store.items.length} item${store.items.length === 1 ? '' : 's'} will be removed.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => dispatch({ type: 'DELETE_STORE', id: store.id })}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
