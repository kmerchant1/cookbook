// Serverless link importer (README: "the one piece needing server code").
// Fetches a recipe URL server-side (dodging browser CORS), extracts its
// schema.org JSON-LD Recipe, and returns a normalized recipe the client can
// drop straight into the Add-Recipe draft.
//
// Deployed as a Vercel Node Function. `@vercel/node` types are provided by
// Vercel's build; this file is intentionally excluded from the local tsc build
// (see tsconfig.node.json) so the app typechecks without that dependency.
//
// Self-contained on purpose — no external npm packages, so it deploys as-is.

import type { VercelRequest, VercelResponse } from '@vercel/node'

// ------------------------------------------------------------ JSON-LD utils

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return []
  return Array.isArray(v) ? v : [v]
}

function isoDurationToDisplay(iso?: string): string {
  if (!iso) return ''
  const m = /P(?:T)?(?:(\d+)H)?(?:(\d+)M)?/i.exec(iso)
  if (!m) return ''
  const total = (m[1] ? +m[1] : 0) * 60 + (m[2] ? +m[2] : 0)
  return total ? `${total} MIN` : ''
}

const QTY_RE =
  /^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?|[½⅓⅔¼¾⅛])\s*)((?:tbsp|tbsps|tablespoons?|tsp|tsps|teaspoons?|cups?|c|oz|ounces?|lb|lbs|pounds?|g|grams?|kg|ml|l|liters?|litres?|cloves?|cans?|packages?|pkg|pinch(?:es)?|slices?|sticks?|bunch(?:es)?|handful|sprigs?|heads?|stalks?|pieces?|knobs?|bottles?|jars?|dash(?:es)?|quarts?|pints?|fl\s?oz)\.?\s+)?/i

function splitIngredient(line: string): { quantity: string; name: string } {
  const text = line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim()
  const m = QTY_RE.exec(text)
  if (m && m[0].trim()) {
    const name = text.slice(m[0].length).trim()
    if (name) return { quantity: m[0].trim(), name }
  }
  return { quantity: '', name: text }
}

function findRecipeNode(data: unknown): Record<string, unknown> | null {
  const stack: unknown[] = [data]
  while (stack.length) {
    const node = stack.pop()
    if (!node || typeof node !== 'object') continue
    if (Array.isArray(node)) {
      stack.push(...node)
      continue
    }
    const obj = node as Record<string, unknown>
    const types = asArray(obj['@type']).map((t) => String(t).toLowerCase())
    if (types.includes('recipe')) return obj
    if (obj['@graph']) stack.push(obj['@graph'])
  }
  return null
}

function normalize(node: Record<string, unknown>) {
  const name = typeof node.name === 'string' ? node.name.trim() : 'Untitled recipe'

  const ingredients = asArray(node.recipeIngredient as unknown)
    .filter((x): x is string => typeof x === 'string')
    .map(splitIngredient)
    .filter((i) => i.name)

  const steps: string[] = []
  const pushInstruction = (item: unknown) => {
    if (typeof item === 'string') steps.push(item.trim())
    else if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>
      if (obj['@type'] === 'HowToSection' && obj.itemListElement) {
        asArray(obj.itemListElement).forEach(pushInstruction)
      } else if (typeof obj.text === 'string') {
        steps.push(obj.text.trim())
      }
    }
  }
  asArray(node.recipeInstructions as unknown).forEach(pushInstruction)

  let servings = 2
  const sv = asArray(node.recipeYield as unknown)[0]
  if (typeof sv === 'number') servings = sv
  else if (typeof sv === 'string') {
    const n = /(\d+)/.exec(sv)
    if (n) servings = +n[1]
  }

  const time =
    isoDurationToDisplay(node.totalTime as string) ||
    isoDurationToDisplay(node.cookTime as string) ||
    isoDurationToDisplay(node.prepTime as string)

  return { name, servings: Math.max(1, servings), time, ingredients, steps: steps.filter(Boolean) }
}

// Pull <script type="application/ld+json"> blocks out of raw HTML.
function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = []
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    try {
      blocks.push(JSON.parse(m[1].trim()))
    } catch {
      // Some sites emit slightly malformed JSON-LD — skip and keep looking.
    }
  }
  return blocks
}

// ----------------------------------------------------------------- SSRF guard

function isSafeUrl(raw: string): URL | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  const host = url.hostname.toLowerCase()
  // Block obvious internal targets.
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host.endsWith('.local') ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  ) {
    return null
  }
  return url
}

// ---------------------------------------------------------------- handler

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url
  if (!raw) {
    return res.status(400).json({ error: 'Missing url parameter' })
  }

  const url = isSafeUrl(raw)
  if (!url) {
    return res.status(400).json({ error: 'Invalid or disallowed URL' })
  }

  let html: string
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)
    const upstream = await fetch(url.toString(), {
      headers: {
        // Present as a real browser; some recipe sites 403 unknown agents.
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!upstream.ok) {
      return res.status(502).json({ error: `Upstream responded ${upstream.status}` })
    }
    html = await upstream.text()
  } catch {
    return res.status(502).json({ error: 'Could not fetch the page' })
  }

  const blocks = extractJsonLdBlocks(html)
  let recipeNode: Record<string, unknown> | null = null
  for (const block of blocks) {
    recipeNode = findRecipeNode(block)
    if (recipeNode) break
  }

  if (!recipeNode) {
    return res.status(404).json({ error: 'No recipe found on the page' })
  }

  // Cache successful parses at the edge for a day — recipes rarely change.
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate')
  return res.status(200).json({ recipe: normalize(recipeNode) })
}
