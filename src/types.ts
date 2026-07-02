// Domain model. Mirrors the suggested Supabase schema (README "Suggested data
// model") but shaped for the client — recipes carry their ingredients/steps/tags
// inline so a recipe is a single object to render and edit.

/** Accent used for a tag chip or store dot. */
export type Hue = 'terra' | 'green' | 'amber' | 'neutral'

export interface Tag {
  id: string
  label: string
  hue: Hue
}

export interface Ingredient {
  id: string
  /** Free text — "2 tbsp", "1 can". No unit math in v1. */
  quantity: string
  name: string
  /** Detail-screen checklist state: user already has this on hand. */
  have?: boolean
}

export interface Step {
  id: string
  text: string
}

export interface Recipe {
  id: string
  name: string
  /** e.g. "40 MIN" — stored as the display string the design uses. */
  time: string
  /** e.g. "4 SERVES". */
  serves: string
  favorite: boolean
  /** Tint behind the placeholder photo / hero. */
  photoBg: string
  heroImageUrl?: string
  sourceUrl?: string
  notes?: string
  tags: Tag[]
  ingredients: Ingredient[]
  steps: Step[]
  createdAt: number
  updatedAt: number
}

export interface GroceryItem {
  id: string
  name: string
  quantity: string
  done: boolean
  sortOrder: number
  sourceRecipeId?: string
}

export interface Store {
  id: string
  name: string
  hue: Hue
  sortOrder: number
  items: GroceryItem[]
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error'
export type Appearance = 'light' | 'dark' | 'system'

export interface Account {
  name: string
  email: string
  /** null when running in local-only mode (no Supabase session). */
  supabaseUserId: string | null
}

export interface AppState {
  recipes: Recipe[]
  stores: Store[]
  tags: Tag[]
  selectedForCook: string[]
  /** Cook-time servings override per recipe id (absent = the recipe's own yield). */
  cookServings: Record<string, number>
  appearance: Appearance
  account: Account
  syncStatus: SyncStatus
  /** Human "JUST NOW" / "2 MIN AGO" label for the sync pill. */
  lastSyncedAt: number | null
}

/** Add-recipe draft (README "Add-recipe draft"). */
export type AddMethod = 'paste' | 'link' | 'manual'
export type ParseStatus = 'idle' | 'loading' | 'parsed' | 'error'

export interface RecipeDraft {
  id?: string // set when editing an existing recipe
  name: string
  servings: number
  time: string
  ingredients: Ingredient[]
  steps: Step[]
  tags: Tag[]
  photoBg: string
  favorite: boolean
  sourceUrl?: string
}

/** Hue accents used consistently for tag chips (README "Design tokens"). */
export const HUE_ORDER: Hue[] = ['terra', 'green', 'amber', 'neutral']

/** Tinted photo backgrounds cycled for new recipes with no photo yet. */
export const PHOTO_BGS = ['#e8d6cc', '#d9e2d9', '#f1e4cd', '#ecd7cd', '#f0e6d2', '#dde6dd']
