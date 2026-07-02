import type { AppState, GroceryItem, Recipe, Store } from '../types'
import { uid } from '../lib/id'
import { makeSeedState } from '../lib/seed'
import type { Action } from './actions'

const now = () => Date.now()

/** Normalize an item name for duplicate-merge (README: "merge by name"). */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:]+$/, '')
}

function mapStore(state: AppState, storeId: string, fn: (s: Store) => Store): AppState {
  return { ...state, stores: state.stores.map((s) => (s.id === storeId ? fn(s) : s)) }
}

function mapRecipe(state: AppState, id: string, fn: (r: Recipe) => Recipe): AppState {
  return { ...state, recipes: state.recipes.map((r) => (r.id === id ? fn(r) : r)) }
}

function nextSortOrder(items: GroceryItem[]): number {
  return items.reduce((max, i) => Math.max(max, i.sortOrder), -1) + 1
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    // ---------------------------------------------------------------- recipes
    case 'ADD_RECIPE': {
      const recipe: Recipe = {
        id: uid('rec'),
        ...action.input,
        createdAt: now(),
        updatedAt: now(),
      }
      return { ...state, recipes: [recipe, ...state.recipes] }
    }

    case 'UPDATE_RECIPE':
      return mapRecipe(state, action.id, (r) => ({
        ...r,
        ...action.input,
        updatedAt: now(),
      }))

    case 'REPLACE_RECIPE':
      return mapRecipe(state, action.recipe.id, () => action.recipe)

    case 'DELETE_RECIPE': {
      const { [action.id]: _dropped, ...cookServings } = state.cookServings
      return {
        ...state,
        recipes: state.recipes.filter((r) => r.id !== action.id),
        selectedForCook: state.selectedForCook.filter((id) => id !== action.id),
        cookServings,
      }
    }

    case 'TOGGLE_FAVORITE':
      return mapRecipe(state, action.id, (r) => ({ ...r, favorite: !r.favorite, updatedAt: now() }))

    case 'TOGGLE_INGREDIENT_HAVE':
      return mapRecipe(state, action.recipeId, (r) => ({
        ...r,
        ingredients: r.ingredients.map((i) =>
          i.id === action.ingredientId ? { ...i, have: !i.have } : i,
        ),
      }))

    // ------------------------------------------------------------------- cook
    case 'TOGGLE_COOK_SELECT': {
      const wasOn = state.selectedForCook.includes(action.id)
      const selected = wasOn
        ? state.selectedForCook.filter((id) => id !== action.id)
        : [...state.selectedForCook, action.id]
      // Deselecting drops any cook-time serving override for that recipe.
      const { [action.id]: _dropped, ...rest } = state.cookServings
      return { ...state, selectedForCook: selected, cookServings: wasOn ? rest : state.cookServings }
    }

    case 'CLEAR_COOK_SELECT':
      return { ...state, selectedForCook: [], cookServings: {} }

    case 'SET_COOK_SERVINGS':
      return {
        ...state,
        cookServings: {
          ...state.cookServings,
          [action.id]: Math.max(1, Math.round(action.servings)),
        },
      }

    // ----------------------------------------------------------------- stores
    case 'ADD_STORE': {
      const store: Store = {
        id: uid('store'),
        name: action.name.trim() || 'New store',
        hue: action.hue,
        sortOrder: state.stores.length,
        items: [],
      }
      return { ...state, stores: [...state.stores, store] }
    }

    case 'RENAME_STORE':
      return mapStore(state, action.id, (s) => ({ ...s, name: action.name.trim() || s.name }))

    case 'SET_STORE_HUE':
      return mapStore(state, action.id, (s) => ({ ...s, hue: action.hue }))

    case 'DELETE_STORE':
      return { ...state, stores: state.stores.filter((s) => s.id !== action.id) }

    // ---------------------------------------------------------- grocery items
    case 'ADD_ITEM':
      return mapStore(state, action.storeId, (s) => ({
        ...s,
        items: [
          ...s.items,
          {
            id: uid('gi'),
            name: action.name.trim(),
            quantity: action.quantity.trim(),
            done: false,
            sortOrder: nextSortOrder(s.items),
          },
        ],
      }))

    case 'UPDATE_ITEM':
      return mapStore(state, action.storeId, (s) => ({
        ...s,
        items: s.items.map((i) =>
          i.id === action.itemId
            ? { ...i, name: action.name.trim(), quantity: action.quantity.trim() }
            : i,
        ),
      }))

    case 'DELETE_ITEM':
      return mapStore(state, action.storeId, (s) => ({
        ...s,
        items: s.items.filter((i) => i.id !== action.itemId),
      }))

    case 'TOGGLE_ITEM_DONE':
      return mapStore(state, action.storeId, (s) => ({
        ...s,
        items: s.items.map((i) => (i.id === action.itemId ? { ...i, done: !i.done } : i)),
      }))

    case 'CLEAR_CHECKED':
      return mapStore(state, action.storeId, (s) => ({
        ...s,
        items: s.items.filter((i) => !i.done),
      }))

    case 'REORDER_ITEMS':
      return mapStore(state, action.storeId, (s) => {
        const items = [...s.items].sort((a, b) => a.sortOrder - b.sortOrder)
        const { fromIndex, toIndex } = action
        if (
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= items.length ||
          toIndex >= items.length ||
          fromIndex === toIndex
        ) {
          return s
        }
        const [moved] = items.splice(fromIndex, 1)
        items.splice(toIndex, 0, moved)
        return { ...s, items: items.map((i, idx) => ({ ...i, sortOrder: idx })) }
      })

    case 'SET_ITEM_ORDER':
      return mapStore(state, action.storeId, (s) => {
        const byId = new Map(s.items.map((i) => [i.id, i]))
        const ordered = action.orderedIds
          .map((id) => byId.get(id))
          .filter((i): i is GroceryItem => Boolean(i))
        // Append any items not present in orderedIds (defensive) to avoid loss.
        for (const item of s.items) {
          if (!action.orderedIds.includes(item.id)) ordered.push(item)
        }
        return { ...s, items: ordered.map((i, idx) => ({ ...i, sortOrder: idx })) }
      })

    case 'PUSH_TO_STORE':
      return mapStore(state, action.storeId, (s) => {
        const items = [...s.items]
        const indexByName = new Map(items.map((i, idx) => [normalizeName(i.name), idx]))
        for (const push of action.items) {
          const key = normalizeName(push.name)
          const existing = indexByName.get(key)
          if (existing != null) {
            // Merge by name: keep the row, mark it needed again.
            items[existing] = { ...items[existing], done: false }
          } else {
            const item: GroceryItem = {
              id: uid('gi'),
              name: push.name.trim(),
              quantity: push.quantity.trim(),
              done: false,
              sortOrder: nextSortOrder(items),
              sourceRecipeId: push.sourceRecipeId,
            }
            items.push(item)
            indexByName.set(key, items.length - 1)
          }
        }
        return { ...s, items }
      })

    // ------------------------------------------------------------------- tags
    case 'ADD_TAG': {
      const label = action.label.trim()
      if (!label || state.tags.some((t) => t.label.toLowerCase() === label.toLowerCase())) {
        return state
      }
      return { ...state, tags: [...state.tags, { id: uid('tag'), label, hue: action.hue }] }
    }

    case 'DELETE_TAG':
      return {
        ...state,
        tags: state.tags.filter((t) => t.id !== action.id),
        // also drop the tag from any recipe that used it (match by label)
        recipes: state.recipes.map((r) => ({
          ...r,
          tags: r.tags.filter(
            (t) => t.label !== state.tags.find((x) => x.id === action.id)?.label,
          ),
        })),
      }

    // --------------------------------------------------------------- settings
    case 'SET_APPEARANCE':
      return { ...state, appearance: action.appearance }

    case 'SET_SYNC_STATUS':
      return {
        ...state,
        syncStatus: action.status,
        lastSyncedAt: action.at === undefined ? state.lastSyncedAt : action.at,
      }

    case 'SIGN_OUT':
      return {
        ...makeSeedState(),
        appearance: state.appearance,
        account: { ...state.account, supabaseUserId: null },
      }

    case 'RESET_SEED':
      return { ...makeSeedState(), appearance: state.appearance }

    default:
      return state
  }
}

/** Actions that represent a data mutation (used to drive the sync-status pill). */
export function isMutation(action: Action): boolean {
  return action.type !== 'SET_SYNC_STATUS' && action.type !== 'SET_APPEARANCE'
}
