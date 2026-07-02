// Client for the link importer (README: "a single serverless function that
// fetches a recipe URL server-side (dodges browser CORS) and parses its JSON-LD
// Recipe schema"). Calls /api/import-recipe; that endpoint lives in /api and is
// served by Vercel in production (or `vercel dev` locally).
//
// With no backend running this rejects — which is exactly the "Couldn't read
// this page" path the UI is built to handle gracefully.

import type { ParsedRecipe } from './parse'

export class ImportError extends Error {}

export async function importFromUrl(url: string, signal?: AbortSignal): Promise<ParsedRecipe> {
  let res: Response
  try {
    res = await fetch(`/api/import-recipe?url=${encodeURIComponent(url)}`, { signal })
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    throw new ImportError('network')
  }

  if (!res.ok) {
    throw new ImportError(`status ${res.status}`)
  }

  const data = (await res.json()) as { recipe?: ParsedRecipe; error?: string }
  if (data.error || !data.recipe) {
    throw new ImportError(data.error || 'no recipe found')
  }
  return data.recipe
}
