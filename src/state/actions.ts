// All the ways AppState can change. Kept in one discriminated union so the
// reducer stays exhaustive and every mutation flows through one place (the seam
// a Supabase write-through layer plugs into later).

import type { Appearance, Hue, Ingredient, Recipe, Step, SyncStatus, Tag } from '../types'

export interface NewRecipeInput {
  name: string
  time: string
  serves: string
  favorite: boolean
  photoBg: string
  tags: Tag[]
  ingredients: Ingredient[]
  steps: Step[]
  sourceUrl?: string
  heroImageUrl?: string
}

export interface PushItem {
  name: string
  quantity: string
  sourceRecipeId?: string
}

export type Action =
  // recipes
  | { type: 'ADD_RECIPE'; input: NewRecipeInput }
  | { type: 'UPDATE_RECIPE'; id: string; input: NewRecipeInput }
  | { type: 'DELETE_RECIPE'; id: string }
  | { type: 'TOGGLE_FAVORITE'; id: string }
  | { type: 'TOGGLE_INGREDIENT_HAVE'; recipeId: string; ingredientId: string }
  | { type: 'REPLACE_RECIPE'; recipe: Recipe }
  // cook selection
  | { type: 'TOGGLE_COOK_SELECT'; id: string }
  | { type: 'CLEAR_COOK_SELECT' }
  | { type: 'SET_COOK_SERVINGS'; id: string; servings: number }
  // stores
  | { type: 'ADD_STORE'; name: string; hue: Hue }
  | { type: 'RENAME_STORE'; id: string; name: string }
  | { type: 'SET_STORE_HUE'; id: string; hue: Hue }
  | { type: 'DELETE_STORE'; id: string }
  // grocery items
  | { type: 'ADD_ITEM'; storeId: string; name: string; quantity: string }
  | { type: 'UPDATE_ITEM'; storeId: string; itemId: string; name: string; quantity: string }
  | { type: 'DELETE_ITEM'; storeId: string; itemId: string }
  | { type: 'TOGGLE_ITEM_DONE'; storeId: string; itemId: string }
  | { type: 'CLEAR_CHECKED'; storeId: string }
  | { type: 'REORDER_ITEMS'; storeId: string; fromIndex: number; toIndex: number }
  | { type: 'SET_ITEM_ORDER'; storeId: string; orderedIds: string[] }
  | { type: 'PUSH_TO_STORE'; storeId: string; items: PushItem[] }
  // tags
  | { type: 'ADD_TAG'; label: string; hue: Hue }
  | { type: 'DELETE_TAG'; id: string }
  // settings / session
  | { type: 'SET_APPEARANCE'; appearance: Appearance }
  | { type: 'SET_SYNC_STATUS'; status: SyncStatus; at?: number | null }
  | { type: 'SIGN_OUT' }
  | { type: 'RESET_SEED' }
