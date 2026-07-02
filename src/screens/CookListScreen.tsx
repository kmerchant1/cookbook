// Screen 4b — Combined shopping list + store picker. Aggregates the selected
// recipes' ingredients; "I already have this" checkboxes remove owned items;
// only the unchecked (needed) items get pushed into the chosen store list.
// (README §4, "Cook → Grocery push")

import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import { aggregateIngredients } from '../state/selectors'
import { displayToServings } from '../lib/format'
import { StatusBar } from '../components/StatusBar'
import { Sheet } from '../components/Sheet'
import { StoreDialog } from '../components/prompts'
import { ArrowRight, CheckIcon, ChevronLeft, PlusIcon } from '../components/Icons'
import { Checkbox, StoreDot } from '../components/primitives'

export function CookListScreen() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()

  const selectedRecipes = state.recipes.filter((r) => state.selectedForCook.includes(r.id))
  const aggregated = useMemo(
    () => aggregateIngredients(selectedRecipes, state.cookServings),
    [selectedRecipes, state.cookServings],
  )

  const [have, setHave] = useState<Set<string>>(new Set())
  const [sheetOpen, setSheetOpen] = useState(false)
  const [addStoreOpen, setAddStoreOpen] = useState(false)
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(state.stores[0]?.id ?? null)
  const [pendingStoreName, setPendingStoreName] = useState<string | null>(null)

  // After creating a store, auto-select it once it appears in state.
  useEffect(() => {
    if (!pendingStoreName) return
    const created = state.stores.find((s) => s.name === pendingStoreName)
    if (created) {
      setSelectedStoreId(created.id)
      setPendingStoreName(null)
    }
  }, [state.stores, pendingStoreName])

  if (selectedRecipes.length === 0) return <Navigate to="/cook" replace />

  const needed = aggregated.filter((a) => !have.has(a.key))
  const selectedStore = state.stores.find((s) => s.id === selectedStoreId)

  const toggleHave = (key: string) =>
    setHave((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  const confirmAdd = () => {
    if (!selectedStore) return
    dispatch({
      type: 'PUSH_TO_STORE',
      storeId: selectedStore.id,
      items: needed.map((n) => ({
        name: n.name,
        quantity: n.quantity,
        sourceRecipeId: n.sourceRecipeIds[0],
      })),
    })
    dispatch({ type: 'CLEAR_COOK_SELECT' })
    navigate('/grocery')
  }

  return (
    <div className="screen">
      <StatusBar />
      <div className="screen-scroll">
        <div className="topbar" style={{ paddingBottom: 14 }}>
          <button className="topbar-back" onClick={() => navigate('/cook')}>
            <ChevronLeft size={20} />
            <span className="topbar-back-titles">
              <span className="title">Shopping list</span>
              <span className="mono sub">
                {selectedRecipes.length} RECIPE{selectedRecipes.length === 1 ? '' : 'S'} ·{' '}
                {aggregated.length} INGREDIENTS
              </span>
            </span>
          </button>
        </div>

        <div className="cook-scale-list">
          {selectedRecipes.map((r) => {
            const base = Math.max(1, displayToServings(r.serves))
            const target = state.cookServings[r.id] ?? base
            const setServings = (servings: number) =>
              dispatch({ type: 'SET_COOK_SERVINGS', id: r.id, servings })
            return (
              <div key={r.id} className="cook-scale-row">
                <span className="cook-scale-name">
                  {r.name}
                  {target !== base && <span className="mono cook-scale-tag">SCALED</span>}
                </span>
                <div className="scaler scaler-sm">
                  <button
                    className="scaler-btn scaler-minus"
                    aria-label={`Fewer servings of ${r.name}`}
                    onClick={() => setServings(Math.max(1, target - 1))}
                  >
                    −
                  </button>
                  <span className="mono scaler-value">{target}</span>
                  <button
                    className="scaler-btn scaler-plus"
                    aria-label={`More servings of ${r.name}`}
                    onClick={() => setServings(Math.min(99, target + 1))}
                  >
                    +
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="combined-head">
          <div className="mono section-label">COMBINED INGREDIENTS</div>
          <div className="hint">Check what you have</div>
        </div>

        <div className="combined-list">
          {aggregated.map((item) => {
            const owned = have.has(item.key)
            return (
              <button
                key={item.key}
                className={`combined-row ${owned ? 'row-done' : ''}`}
                onClick={() => toggleHave(item.key)}
              >
                <Checkbox checked={owned} onChange={() => toggleHave(item.key)} ariaLabel={item.name} />
                <span className="combined-name">{item.name}</span>
                <span className="mono combined-q">{item.quantity}</span>
              </button>
            )
          })}
        </div>
        <div style={{ height: 8 }} />
      </div>

      <div className="action-bar">
        <button
          className="btn btn-primary btn-block"
          disabled={needed.length === 0}
          onClick={() => setSheetOpen(true)}
        >
          {needed.length === 0
            ? 'You have everything'
            : `Add ${needed.length} item${needed.length === 1 ? '' : 's'} to grocery`}
          {needed.length > 0 && <ArrowRight size={19} />}
        </button>
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} label="Add to which list?">
        <div className="sheet-title">Add to which list?</div>
        <div className="sheet-sub">
          {needed.length} item{needed.length === 1 ? '' : 's'} will be sorted into the store you pick.
        </div>
        <div className="store-options">
          {state.stores.map((store) => {
            const on = store.id === selectedStoreId
            return (
              <button
                key={store.id}
                className={`store-option ${on ? 'store-option-on' : ''}`}
                onClick={() => setSelectedStoreId(store.id)}
              >
                <StoreDot hue={store.hue} />
                <span className="store-option-body">
                  <span className="store-option-name">{store.name}</span>
                  <span className="mono store-option-sub">{store.items.length} ITEMS ALREADY</span>
                </span>
                <span className={`radio ${on ? 'radio-on' : ''}`}>{on && <CheckIcon size={14} />}</span>
              </button>
            )
          })}
          <button className="dashed-row" onClick={() => setAddStoreOpen(true)}>
            <PlusIcon size={17} strokeWidth={2.2} />
            New store
          </button>
        </div>
        <button
          className="btn btn-primary btn-block btn-action"
          style={{ marginTop: 16 }}
          disabled={!selectedStore || needed.length === 0}
          onClick={confirmAdd}
        >
          {selectedStore
            ? `Add ${needed.length} item${needed.length === 1 ? '' : 's'} to ${selectedStore.name}`
            : 'Pick a store'}
        </button>
      </Sheet>

      <StoreDialog
        open={addStoreOpen}
        title="New store"
        submitLabel="Create"
        onClose={() => setAddStoreOpen(false)}
        onSubmit={(name, hue) => {
          dispatch({ type: 'ADD_STORE', name, hue })
          setPendingStoreName(name)
        }}
      />
    </div>
  )
}
