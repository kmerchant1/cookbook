// Scale ingredient quantities by a factor (target servings ÷ base servings).
//
// Quantities are free text — "2 tbsp", "1 1/2 cups", "1 can", "3 cloves",
// "to serve". So we parse the *leading* number (integer, decimal, fraction,
// mixed number, unicode vulgar fraction, or a range like "2-3"), multiply it,
// and format it back to a cook-friendly string. Anything with no leading number
// ("to taste", "a pinch") passes through untouched. Only the first number is
// scaled, so a package size like "1 (14 oz) can" scales the count, not the size.

const VULGAR: Record<string, number> = {
  '½': 1 / 2, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 1 / 4, '¾': 3 / 4,
  '⅕': 1 / 5, '⅖': 2 / 5, '⅗': 3 / 5, '⅘': 4 / 5,
  '⅙': 1 / 6, '⅚': 5 / 6, '⅛': 1 / 8, '⅜': 3 / 8, '⅝': 5 / 8, '⅞': 7 / 8,
}
const VULGAR_CLASS = '[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]'

// A leading numeric token — most specific alternative first so "1 1/2" beats "1".
const LEAD = new RegExp(
  '^\\s*(' +
    '\\d+(?:\\.\\d+)?\\s+\\d+\\s*/\\s*\\d+' + // mixed: 1 1/2
    '|\\d+\\s*' + VULGAR_CLASS +              // mixed unicode: 1½ / 1 ½
    '|\\d+\\s*/\\s*\\d+' +                    // fraction: 3/4
    '|' + VULGAR_CLASS +                      // unicode: ½
    '|\\d+(?:\\.\\d+)?' +                     // decimal / integer: 1.5 / 2
    ')',
)

function parseToken(token: string): number {
  const tok = token.trim()
  // unicode vulgar fraction, optionally after an integer ("1½", "1 ½")
  const vm = new RegExp(VULGAR_CLASS).exec(tok)
  if (vm) {
    const whole = tok.slice(0, vm.index).trim()
    return (whole ? parseInt(whole, 10) : 0) + VULGAR[vm[0]]
  }
  const mixed = /^(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(tok) // 1 1/2
  if (mixed) return +mixed[1] + +mixed[2] / +mixed[3]
  const frac = /^(\d+)\s*\/\s*(\d+)$/.exec(tok) // 3/4
  if (frac) return +frac[1] / +frac[2]
  return parseFloat(tok)
}

// Common cooking fractions; close values snap onto these for readable output.
const NICE: Array<[number, string]> = [
  [1 / 8, '⅛'], [1 / 6, '⅙'], [1 / 4, '¼'], [1 / 3, '⅓'], [3 / 8, '⅜'],
  [1 / 2, '½'], [5 / 8, '⅝'], [2 / 3, '⅔'], [3 / 4, '¾'], [5 / 6, '⅚'], [7 / 8, '⅞'],
]

function formatNumber(n: number): string {
  if (!isFinite(n) || n <= 0) return ''
  const whole = Math.floor(n + 1e-6)
  const frac = n - whole
  if (frac < 0.02) return String(whole)
  let label: string | null = null
  let bestErr = 0.03
  for (const [val, sym] of NICE) {
    const err = Math.abs(frac - val)
    if (err < bestErr) {
      bestErr = err
      label = sym
    }
  }
  if (label) return whole > 0 ? `${whole}${label}` : label
  // No clean fraction — show up to 2 decimals, trailing zeros trimmed.
  return String(Math.round(n * 100) / 100)
}

function consume(s: string): { value: number; rest: string } | null {
  const m = LEAD.exec(s)
  if (!m) return null
  const value = parseToken(m[1])
  if (!isFinite(value)) return null
  return { value, rest: s.slice(m[0].length) }
}

/** Multiply the numeric part of a free-text quantity by `factor`. */
export function scaleQuantity(quantity: string, factor: number): string {
  if (!quantity || !isFinite(factor) || factor <= 0 || factor === 1) return quantity
  const first = consume(quantity)
  if (!first) return quantity

  // Range? "2-3", "2 – 3", "2 to 3" — scale both ends, keep the separator.
  const sep = /^(\s*(?:-|–|—|to)\s*)/i.exec(first.rest)
  if (sep) {
    const second = consume(first.rest.slice(sep[0].length))
    if (second) {
      return (
        formatNumber(first.value * factor) +
        sep[1] +
        formatNumber(second.value * factor) +
        second.rest
      )
    }
  }
  return formatNumber(first.value * factor) + first.rest
}

/** Scale factor from a recipe's base serving count to a cook target. */
export function scaleFactor(base: number, target: number): number {
  if (!base || base <= 0) return 1
  return target / base
}
