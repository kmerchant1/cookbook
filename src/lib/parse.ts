// Recipe parsing. Two entry points:
//   parsePastedText(raw)  — heuristic parse of free-form pasted recipe text.
//   normalizeJsonLd(node) — turn a schema.org JSON-LD Recipe into our shape.
// Both return a ParsedRecipe. The parser is intentionally forgiving: auto-detection
// "isn't perfect — review before saving" (README), and everything stays editable.

export interface ParsedIngredient {
  quantity: string
  name: string
}

export interface ParsedRecipe {
  name: string
  servings: number
  time: string
  ingredients: ParsedIngredient[]
  steps: string[]
}

const INGREDIENT_HEADINGS = /^(ingredients?|you(?:'| a)?ll need|shopping list)\b/i
const STEP_HEADINGS = /^(instructions?|directions?|steps?|method|preparation)\b/i
const META_HEADINGS = /^(prep|cook|total|time|serv(es|ings)|yield|nutrition|notes?)\b/i

// Leading quantity: numbers, fractions, ranges, unicode fractions, then an
// optional unit word — e.g. "1 1/2 cups", "2-3 tbsp", "¼ cup", "1 can".
const QTY_RE =
  /^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?|[½⅓⅔¼¾⅛])\s*)((?:tbsp|tbsps|tablespoons?|tsp|tsps|teaspoons?|cups?|c|oz|ounces?|lb|lbs|pounds?|g|grams?|kg|ml|l|liters?|litres?|cloves?|cans?|packages?|pkg|pinch(?:es)?|slices?|sticks?|bunch(?:es)?|handful|sprigs?|heads?|stalks?|pieces?|knobs?|bottles?|jars?|dash(?:es)?|quarts?|pints?|fl\s?oz)\.?\s+)?/i

const BULLET_RE = /^\s*(?:[-*•‣◦·]|\d+[.)])\s+/

function cleanLine(line: string): string {
  return line.replace(BULLET_RE, '').trim()
}

/** Split one ingredient line into a free-text quantity + a name. */
export function splitIngredient(line: string): ParsedIngredient {
  const text = cleanLine(line)
  const m = QTY_RE.exec(text)
  if (m && m[0].trim()) {
    const quantity = m[0].trim()
    const name = text.slice(m[0].length).trim()
    if (name) return { quantity, name }
  }
  return { quantity: '', name: text }
}

function extractServings(text: string): number {
  const m = /serv(?:es|ings?)[:\s]*([0-9]+)/i.exec(text) || /yield[:\s]*([0-9]+)/i.exec(text)
  return m ? Math.max(1, parseInt(m[1], 10)) : 2
}

function extractTime(text: string): string {
  // Prefer an explicit total time, else the first "N min/hr" mention.
  const total = /total[^0-9]*([0-9]+)\s*(min|minutes|hr|hour|hours)/i.exec(text)
  const any = /([0-9]+)\s*(min|minutes|hr|hour|hours)/i.exec(text)
  const m = total || any
  if (!m) return ''
  const n = parseInt(m[1], 10)
  const unit = /h/i.test(m[2]) ? 'HR' : 'MIN'
  return `${n} ${unit}`
}

export function parsePastedText(raw: string): ParsedRecipe {
  const lines = raw.split(/\r?\n/).map((l) => l.replace(/\s+$/, ''))
  const nonEmpty = lines.filter((l) => l.trim())

  // Name: the first non-empty line that isn't itself a section heading.
  let name = ''
  for (const l of nonEmpty) {
    const t = l.trim()
    if (INGREDIENT_HEADINGS.test(t) || STEP_HEADINGS.test(t)) break
    name = t
    break
  }

  // Walk the lines, tracking which section we're in.
  type Section = 'none' | 'ingredients' | 'steps'
  let section: Section = 'none'
  const ingredientLines: string[] = []
  const stepLines: string[] = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue
    if (INGREDIENT_HEADINGS.test(line)) {
      section = 'ingredients'
      continue
    }
    if (STEP_HEADINGS.test(line)) {
      section = 'steps'
      continue
    }
    if (META_HEADINGS.test(line) && section === 'none') continue
    if (line === name && section === 'none') continue

    if (section === 'ingredients') ingredientLines.push(line)
    else if (section === 'steps') stepLines.push(line)
  }

  // Fallback when there were no headings: split on bullets vs prose length.
  if (!ingredientLines.length && !stepLines.length) {
    for (const l of nonEmpty) {
      if (l.trim() === name) continue
      if (BULLET_RE.test(l) && l.length < 90) ingredientLines.push(l.trim())
      else stepLines.push(l.trim())
    }
  }

  const ingredients = ingredientLines.map(splitIngredient).filter((i) => i.name)
  const steps = stepLines.map(cleanLine).filter(Boolean)

  return {
    name: name || 'Untitled recipe',
    servings: extractServings(raw),
    time: extractTime(raw),
    ingredients,
    steps,
  }
}

// ------------------------------------------------------------------ JSON-LD

/** ISO-8601 duration ("PT1H30M") → "90 MIN" display string. */
export function isoDurationToDisplay(iso?: string): string {
  if (!iso) return ''
  const m = /P(?:T)?(?:(\d+)H)?(?:(\d+)M)?/i.exec(iso)
  if (!m) return ''
  const hours = m[1] ? parseInt(m[1], 10) : 0
  const mins = m[2] ? parseInt(m[2], 10) : 0
  const total = hours * 60 + mins
  if (!total) return ''
  return `${total} MIN`
}

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return []
  return Array.isArray(v) ? v : [v]
}

/** Normalize a schema.org Recipe node (already located) into ParsedRecipe. */
export function normalizeJsonLd(node: Record<string, unknown>): ParsedRecipe {
  const name = typeof node.name === 'string' ? node.name.trim() : 'Untitled recipe'

  const rawIngredients = asArray(node.recipeIngredient as unknown) as unknown[]
  const ingredients = rawIngredients
    .filter((x): x is string => typeof x === 'string')
    .map(splitIngredient)
    .filter((i) => i.name)

  // recipeInstructions can be strings, HowToStep objects, or HowToSection groups.
  const steps: string[] = []
  const pushInstruction = (item: unknown) => {
    if (typeof item === 'string') {
      steps.push(item.trim())
    } else if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>
      if (obj['@type'] === 'HowToSection' && obj.itemListElement) {
        asArray(obj.itemListElement).forEach(pushInstruction)
      } else if (typeof obj.text === 'string') {
        steps.push(obj.text.trim())
      }
    }
  }
  asArray(node.recipeInstructions as unknown).forEach(pushInstruction)

  const servingsRaw = node.recipeYield ?? (node as Record<string, unknown>).yield
  let servings = 2
  const sv = asArray(servingsRaw as unknown)[0]
  if (typeof sv === 'number') servings = sv
  else if (typeof sv === 'string') {
    const n = /(\d+)/.exec(sv)
    if (n) servings = parseInt(n[1], 10)
  }

  const time =
    isoDurationToDisplay(node.totalTime as string) ||
    isoDurationToDisplay(node.cookTime as string) ||
    isoDurationToDisplay(node.prepTime as string)

  return {
    name,
    servings: Math.max(1, servings),
    time,
    ingredients,
    steps: steps.filter(Boolean),
  }
}

/**
 * Find the first Recipe node in a parsed JSON-LD payload (which may be a single
 * object, an array, or wrapped in an @graph). Returns null if none.
 */
export function findRecipeNode(data: unknown): Record<string, unknown> | null {
  const stack: unknown[] = [data]
  while (stack.length) {
    const node = stack.pop()
    if (!node || typeof node !== 'object') continue
    if (Array.isArray(node)) {
      stack.push(...node)
      continue
    }
    const obj = node as Record<string, unknown>
    const type = obj['@type']
    const types = asArray(type).map((t) => String(t).toLowerCase())
    if (types.includes('recipe')) return obj
    if (obj['@graph']) stack.push(obj['@graph'])
  }
  return null
}
