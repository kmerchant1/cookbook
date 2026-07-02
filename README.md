# cookbook

A personal recipe box that feeds smart, store-sorted grocery lists — synced
across every device. Mobile-first React app with a bottom tab bar
(Recipes · Cook · Grocery · Settings), built to the design handoff and wrappable
as a native app with Capacitor.

Built per the design spec in `extracted/design_handoff_cookbook/README.md`
(reference only — not shipped).

## Stack

| Concern | Choice |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Routing | react-router (HashRouter, for web + Capacitor) |
| State | React context + reducer, persisted to `localStorage` |
| Styling | CSS custom properties (design tokens) with light/dark themes |
| Native wrapper | Capacitor (`capacitor.config.ts`) |
| Backend (auth + sync) | Supabase — client + `supabase/schema.sql` (RLS) |
| Link importer | Vercel serverless function (`api/import-recipe.ts`) |
| Hosting | Vercel (`vercel.json`) |

The app is **local-first**: it runs fully offline against `localStorage` and is
seeded with the sample cookbook from the design. Supabase and the link importer
are wired to activate when configured, without blocking local use.

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
```

Other scripts:

```bash
npm run build        # typecheck + production build to dist/
npm run preview      # preview the production build
npm run typecheck    # tsc, no emit
```

## What's implemented

All six screen groups and their states from the design board:

1. **Recipe Library** — search, filter chips (All / Favorites / tags), 2-col grid
   (3-col on tablet), empty state, live search + results count.
2. **Add Recipe** — segmented Paste · Link · Manual:
   - **Paste** parses text live into an editable preview (name, ingredients, steps).
   - **Link** calls the importer → loading (spinner + skeletons) → review, or the
     "Couldn't read this page" error card with manual/paste fallbacks.
   - **Manual** — structured form with add/remove ingredient & step rows, servings
     stepper, tags.
3. **Recipe Detail** — hero, meta pills, ingredient checklist ("Check what you
   have"), numbered steps, Cook this, and the ••• Edit / Share / Delete popover.
4. **Cook Today** — select recipes → combined ingredient list (aggregated by name,
   "I already have this") → store-picker bottom sheet → push needed items into a
   store list (duplicates merge by name).
5. **Grocery Lists** — collapsible per-store cards, drag-to-reorder items,
   check/uncheck with strikethrough, add item, clear-checked, rename/delete store.
6. **Settings** — account + live sync pill, store manager, tag manager, appearance
   (Light · Dark · System), sign out.

**Dark mode** has full parity via the `[data-theme="dark"]` token set and follows
the Appearance setting / OS.

## Project structure

```
api/import-recipe.ts     Serverless JSON-LD recipe importer (Vercel function)
capacitor.config.ts      Native wrapper config
supabase/schema.sql      Postgres schema + Row-Level Security
vercel.json              Build + function + SPA-rewrite config
src/
  main.tsx, App.tsx      Entry + router
  index.css              Design tokens (light/dark) + base + animations
  app.css                Component styles
  types.ts               Domain model
  lib/                   parse (paste + JSON-LD), importer client, storage,
                         supabase client, seed data, id/format helpers
  state/                 reducer, actions, selectors (aggregation), context, theme
  components/            Icons, StatusBar, TabBar, PhoneFrame, Sheet, Dialog,
                         prompts, shared primitives
  screens/               One file per screen group
```

## Enabling Supabase (cloud auth + sync)

The app runs without it. To turn on cross-device sync:

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor (creates tables + RLS).
3. `cp .env.example .env` and fill `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
4. Build the sync repository against `src/lib/supabase.ts` and wire auth (see the
   TODO in the handoff notes). `src/lib/storage.ts` is the seam the write-through
   layer replaces.

## The link importer

`api/import-recipe.ts` fetches a URL server-side (dodging CORS), extracts the
schema.org JSON-LD `Recipe`, and returns a normalized recipe. It runs on Vercel
in production. Locally, run `vercel dev` (the Vite dev server proxies `/api` to
`localhost:3000`). With no importer running, the Link tab surfaces the designed
error state — by design, it never dead-ends.

## Native (Capacitor)

```bash
npm run build
npx cap add ios          # and/or: npx cap add android
npx cap sync
npx cap open ios
```
