// Derived views over AppState — pure functions, no React. `aggregateIngredients`
// is the "selectedForCook → combined shopping list" derivation the README calls
// out (state: "aggregatedIngredients (derived: union of selected recipes'
// ingredients with have/need flags)").

import type { Recipe } from '../types'
import { normalizeName } from './reducer'
import { displayToServings } from '../lib/format'
import { scaleFactor, scaleQuantity } from '../lib/scale'

export interface AggregatedItem {
  /** Stable key = normalized name, so the cook screen can track have-state. */
  key: string
  name: string
  quantity: string
  /** ids of recipes that contributed this ingredient */
  sourceRecipeIds: string[]
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Union of the given recipes' ingredients, merged by normalized name. Each
 * recipe's quantities are scaled to its cook-time serving target (from
 * `cookServings`, keyed by recipe id) before merging — so the combined shopping
 * list reflects however many people you're actually cooking for.
 */
export function aggregateIngredients(
  recipes: Recipe[],
  cookServings: Record<string, number> = {},
): AggregatedItem[] {
  const byKey = new Map<string, AggregatedItem & { quantities: string[] }>()

  for (const recipe of recipes) {
    const base = Math.max(1, displayToServings(recipe.serves))
    const factor = scaleFactor(base, cookServings[recipe.id] ?? base)
    for (const ing of recipe.ingredients) {
      if (!ing.name.trim()) continue
      const key = normalizeName(ing.name)
      const quantity = scaleQuantity(ing.quantity, factor)
      const existing = byKey.get(key)
      if (existing) {
        if (quantity && !existing.quantities.includes(quantity)) {
          existing.quantities.push(quantity)
        }
        if (!existing.sourceRecipeIds.includes(recipe.id)) {
          existing.sourceRecipeIds.push(recipe.id)
        }
      } else {
        byKey.set(key, {
          key,
          name: capitalizeFirst(ing.name.trim()),
          quantity: '',
          quantities: quantity ? [quantity] : [],
          sourceRecipeIds: [recipe.id],
        })
      }
    }
  }

  return [...byKey.values()].map(({ quantities, ...item }) => ({
    ...item,
    // No unit math in v1 — just join distinct quantities.
    quantity: quantities.join(' + '),
  }))
}

/** Filter the library by search query + active tag + favorites-only. */
export function filterRecipes(
  recipes: Recipe[],
  query: string,
  activeTag: string | null,
  favoritesOnly: boolean,
): Recipe[] {
  const q = query.trim().toLowerCase()
  return recipes.filter((r) => {
    if (favoritesOnly && !r.favorite) return false
    if (activeTag && !r.tags.some((t) => t.label === activeTag)) return false
    if (!q) return true
    if (r.name.toLowerCase().includes(q)) return true
    if (r.tags.some((t) => t.label.toLowerCase().includes(q))) return true
    return r.ingredients.some((i) => i.name.toLowerCase().includes(q))
  })
}
