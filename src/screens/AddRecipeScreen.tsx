// Screen 2 — Add Recipe (modal/pushed). Segmented Paste · Link · Manual.
//  - Paste: live parse → PARSED preview card (every field editable via Manual).
//  - Link:  URL + Fetch → loading (spinner + skeletons) → success (Manual) | error.
//  - Manual: structured, add/remove ingredient & step rows, tags.
// (README §2 + "Interactions")

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import type { Hue, Ingredient, Step, Tag } from '../types'
import { PHOTO_BGS } from '../types'
import { uid } from '../lib/id'
import { parsePastedText, type ParsedRecipe } from '../lib/parse'
import { importFromUrl } from '../lib/importer'
import { displayToServings, servingsToDisplay } from '../lib/format'
import { Dialog } from '../components/Dialog'
import {
  CheckIcon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
  RetryIcon,
  SpinnerIcon,
  WarningIcon,
} from '../components/Icons'
import { Chip, HuePicker, PhotoPlaceholder, TagChip } from '../components/primitives'

type Method = 'paste' | 'link' | 'manual'
type LinkStatus = 'idle' | 'loading' | 'error'

interface Draft {
  name: string
  servings: number
  time: string
  ingredients: Ingredient[]
  steps: Step[]
  tags: Tag[]
  photoBg: string
  favorite: boolean
  sourceUrl?: string
  heroImageUrl?: string
}

const toIng = (i: { quantity: string; name: string }): Ingredient => ({
  id: uid('ing'),
  quantity: i.quantity,
  name: i.name,
})
const toStep = (t: string): Step => ({ id: uid('step'), text: t })

function draftFromParsed(parsed: ParsedRecipe, base: Draft): Draft {
  return {
    ...base,
    name: parsed.name === 'Untitled recipe' ? '' : parsed.name,
    servings: parsed.servings,
    time: parsed.time,
    ingredients: parsed.ingredients.map(toIng),
    steps: parsed.steps.map(toStep),
    // A link import may carry the recipe photo; keep any existing one otherwise.
    heroImageUrl: parsed.image || base.heroImageUrl,
  }
}

export function AddRecipeScreen() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const { id: editingId } = useParams()
  const [searchParams] = useSearchParams()

  const editing = editingId ? state.recipes.find((r) => r.id === editingId) : undefined

  const emptyDraft = useMemo<Draft>(
    () => ({
      name: '',
      servings: 2,
      time: '',
      ingredients: [],
      steps: [],
      tags: [],
      photoBg: PHOTO_BGS[state.recipes.length % PHOTO_BGS.length],
      favorite: false,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const [method, setMethod] = useState<Method>(
    editing ? 'manual' : (searchParams.get('method') as Method) || 'paste',
  )
  const [pasteText, setPasteText] = useState('')
  const [url, setUrl] = useState('')
  const [linkStatus, setLinkStatus] = useState<LinkStatus>('idle')
  const [tagPickerOpen, setTagPickerOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const [draft, setDraft] = useState<Draft>(() =>
    editing
      ? {
          name: editing.name,
          servings: displayToServings(editing.serves),
          time: editing.time,
          ingredients: editing.ingredients.map((i) => ({ ...i })),
          steps: editing.steps.map((s) => ({ ...s })),
          tags: editing.tags.map((t) => ({ ...t })),
          photoBg: editing.photoBg,
          favorite: editing.favorite,
          sourceUrl: editing.sourceUrl,
          heroImageUrl: editing.heroImageUrl,
        }
      : emptyDraft,
  )

  // Live-parse pasted text into the draft (README: "Paste parses live").
  useEffect(() => {
    if (method !== 'paste') return
    if (!pasteText.trim()) {
      setDraft((d) => ({ ...d, name: '', ingredients: [], steps: [] }))
      return
    }
    setDraft((d) => draftFromParsed(parsePastedText(pasteText), d))
  }, [pasteText, method])

  const hasParsed = pasteText.trim() !== '' && (draft.ingredients.length > 0 || draft.steps.length > 0)
  const canSave = draft.name.trim() !== '' && draft.ingredients.some((i) => i.name.trim() !== '')

  const save = () => {
    if (!canSave) return
    const input = {
      name: draft.name.trim(),
      time: draft.time.trim(),
      serves: servingsToDisplay(draft.servings),
      favorite: draft.favorite,
      photoBg: draft.photoBg,
      tags: draft.tags,
      ingredients: draft.ingredients
        .filter((i) => i.name.trim())
        .map((i) => ({ ...i, name: i.name.trim(), quantity: i.quantity.trim() })),
      steps: draft.steps.filter((s) => s.text.trim()).map((s) => ({ ...s, text: s.text.trim() })),
      sourceUrl: draft.sourceUrl,
      heroImageUrl: draft.heroImageUrl?.trim() || undefined,
    }
    if (editingId) {
      dispatch({ type: 'UPDATE_RECIPE', id: editingId, input })
      // Editing is always entered from the recipe's detail screen, so pop back
      // to it (showing the saved changes) instead of pushing a new entry — that
      // avoids the back button looping through the edit screen.
      navigate(-1)
    } else {
      dispatch({ type: 'ADD_RECIPE', input })
      // Replace the add screen in history so back doesn't return to the form.
      navigate('/recipes', { replace: true })
    }
  }

  const runFetch = async () => {
    if (!url.trim()) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLinkStatus('loading')
    try {
      const parsed = await importFromUrl(url.trim(), ctrl.signal)
      setDraft((d) => ({ ...draftFromParsed(parsed, d), sourceUrl: url.trim() }))
      setLinkStatus('idle')
      setMethod('manual') // review the structured result before saving
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      setLinkStatus('error')
    }
  }

  useEffect(() => () => abortRef.current?.abort(), [])

  return (
    <div className="screen">
      <div className="topbar">
        <button className="topbar-btn" onClick={() => navigate(-1)}>
          Cancel
        </button>
        <span className="topbar-title">{editing ? 'Edit recipe' : 'New recipe'}</span>
        <button className="topbar-btn topbar-btn-primary" disabled={!canSave} onClick={save}>
          Save
        </button>
      </div>

      <div className="add-body">
        <div className="segmented" role="tablist" aria-label="Input method">
          {(['paste', 'link', 'manual'] as Method[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={method === m}
              className={`segmented-item ${method === m ? 'segmented-item-on' : ''}`}
              onClick={() => setMethod(m)}
            >
              {m === 'paste' ? 'Paste' : m === 'link' ? 'Link' : 'Manual'}
            </button>
          ))}
        </div>

        {method === 'paste' && (
          <PasteTab
            text={pasteText}
            onText={setPasteText}
            draft={draft}
            hasParsed={hasParsed}
            onEdit={() => setMethod('manual')}
          />
        )}

        {method === 'link' && (
          <LinkTab
            url={url}
            onUrl={setUrl}
            status={linkStatus}
            onFetch={runFetch}
            onManual={() => {
              setLinkStatus('idle')
              setMethod('manual')
            }}
            onPaste={() => {
              setLinkStatus('idle')
              setMethod('paste')
            }}
            onRetry={() => setLinkStatus('idle')}
          />
        )}

        {method === 'manual' && (
          <ManualForm
            draft={draft}
            setDraft={setDraft}
            onAddTag={() => setTagPickerOpen(true)}
          />
        )}
      </div>

      <TagPickerDialog
        open={tagPickerOpen}
        onClose={() => setTagPickerOpen(false)}
        allTags={state.tags}
        selected={draft.tags}
        onToggle={(tag) =>
          setDraft((d) => ({
            ...d,
            tags: d.tags.some((t) => t.label === tag.label)
              ? d.tags.filter((t) => t.label !== tag.label)
              : [...d.tags, { id: uid('tag'), label: tag.label, hue: tag.hue }],
          }))
        }
        onCreate={(label, hue) => {
          dispatch({ type: 'ADD_TAG', label, hue })
          setDraft((d) =>
            d.tags.some((t) => t.label.toLowerCase() === label.toLowerCase())
              ? d
              : { ...d, tags: [...d.tags, { id: uid('tag'), label, hue }] },
          )
        }}
      />
    </div>
  )
}

/* --------------------------------------------------------------- Paste tab */
function PasteTab({
  text,
  onText,
  draft,
  hasParsed,
  onEdit,
}: {
  text: string
  onText: (v: string) => void
  draft: Draft
  hasParsed: boolean
  onEdit: () => void
}) {
  return (
    <>
      <div className="add-section">
        <div className="mono field-label" style={{ marginBottom: 8 }}>
          PASTE RECIPE TEXT
        </div>
        <textarea
          className="field"
          style={{ minHeight: 132, fontSize: 13, borderRadius: 14 }}
          placeholder={
            'Paste a full recipe here — name, an Ingredients list, and numbered Instructions. We’ll detect the parts.'
          }
          value={text}
          onChange={(e) => onText(e.target.value)}
        />
      </div>

      {hasParsed && (
        <>
          <div className="parsed-divider">
            <div className="line" />
            <div className="mono parsed-marker">
              <CheckIcon size={14} strokeWidth={2.6} /> PARSED
            </div>
            <div className="line" />
          </div>
          <div style={{ padding: '0 20px 28px' }}>
            <div className="preview-card">
              <div className="preview-head">
                <div>
                  <div className="preview-name">{draft.name || 'Untitled recipe'}</div>
                  <div className="mono preview-name-sub">DETECTED NAME · TAP TO EDIT</div>
                </div>
                <button aria-label="Edit name" onClick={onEdit} style={{ color: 'var(--ink-3)' }}>
                  <PencilIcon size={18} />
                </button>
              </div>
              <div className="preview-section">
                <div className="preview-section-head">
                  <div className="mono section-label">INGREDIENTS · {draft.ingredients.length}</div>
                  <button className="link-primary" onClick={onEdit}>
                    Edit
                  </button>
                </div>
                <div className="stack" style={{ gap: 9 }}>
                  {draft.ingredients.map((ing) => (
                    <div key={ing.id} className="preview-ing-row">
                      <span className="mono preview-ing-q">{ing.quantity}</span>
                      <span className="preview-ing-n">{ing.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="preview-section">
                <div className="mono section-label" style={{ marginBottom: 11 }}>
                  STEPS · {draft.steps.length}
                </div>
                <div className="stack" style={{ gap: 12 }}>
                  {draft.steps.map((step, i) => (
                    <div key={step.id} className="preview-step-row">
                      <span className="mono step-badge">{i + 1}</span>
                      <span className="preview-step-text">{step.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="footnote">Auto-detection isn't perfect — review before saving.</div>
          </div>
        </>
      )}
    </>
  )
}

/* ---------------------------------------------------------------- Link tab */
function LinkTab({
  url,
  onUrl,
  status,
  onFetch,
  onManual,
  onPaste,
  onRetry,
}: {
  url: string
  onUrl: (v: string) => void
  status: LinkStatus
  onFetch: () => void
  onManual: () => void
  onPaste: () => void
  onRetry: () => void
}) {
  return (
    <>
      <div className="add-section">
        <div className="mono field-label" style={{ marginBottom: 8 }}>
          RECIPE URL
        </div>
        <div className="link-row">
          <input
            className="field"
            style={{ borderRadius: 13, fontWeight: 500, fontSize: 13 }}
            placeholder="https://example.com/recipe"
            value={url}
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            onChange={(e) => onUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onFetch()}
          />
          <button
            className={`fetch-btn ${status === 'error' ? 'fetch-btn-muted' : ''}`}
            disabled={status === 'loading'}
            onClick={onFetch}
          >
            {status === 'loading' ? <SpinnerIcon size={15} strokeWidth={2.4} className="spin" /> : 'Fetch'}
          </button>
        </div>
      </div>

      {status === 'loading' && (
        <div className="loading-center">
          <SpinnerIcon size={40} className="spin" />
          <div className="loading-title">Reading the page…</div>
          <div className="loading-sub">Looking for ingredients and steps.</div>
          <div className="skeletons">
            <div className="skeleton" style={{ width: '70%' }} />
            <div className="skeleton" style={{ width: '100%', animationDelay: '.15s' }} />
            <div className="skeleton" style={{ width: '88%', animationDelay: '.3s' }} />
            <div className="skeleton" style={{ width: '94%', animationDelay: '.45s' }} />
          </div>
        </div>
      )}

      {status === 'error' && (
        <div style={{ padding: '22px 20px 0' }}>
          <div className="error-card">
            <div className="error-icon">
              <WarningIcon size={26} />
            </div>
            <div className="error-title">Couldn't read this page</div>
            <div className="error-body">
              We couldn't find a recipe here — some sites block automatic imports. You can still add
              it by hand.
            </div>
            <div className="error-actions">
              <button className="btn btn-primary btn-block" onClick={onManual}>
                Enter it manually
              </button>
              <button className="btn btn-secondary btn-block" onClick={onPaste}>
                Paste the text instead
              </button>
            </div>
          </div>
          <button className="try-again" onClick={onRetry} style={{ width: '100%' }}>
            <RetryIcon size={15} />
            Try a different link
          </button>
        </div>
      )}
    </>
  )
}

/* ------------------------------------------------------------- Manual form */
function ManualForm({
  draft,
  setDraft,
  onAddTag,
}: {
  draft: Draft
  setDraft: React.Dispatch<React.SetStateAction<Draft>>
  onAddTag: () => void
}) {
  const setName = (name: string) => setDraft((d) => ({ ...d, name }))
  const setTime = (time: string) => setDraft((d) => ({ ...d, time }))
  const setHeroImageUrl = (heroImageUrl: string) => setDraft((d) => ({ ...d, heroImageUrl }))
  const bumpServings = (delta: number) =>
    setDraft((d) => ({ ...d, servings: Math.max(1, d.servings + delta) }))

  const updateIng = (id: string, patch: Partial<Ingredient>) =>
    setDraft((d) => ({
      ...d,
      ingredients: d.ingredients.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }))
  const addIng = () =>
    setDraft((d) => ({ ...d, ingredients: [...d.ingredients, toIng({ quantity: '', name: '' })] }))
  const removeIng = (id: string) =>
    setDraft((d) => ({ ...d, ingredients: d.ingredients.filter((i) => i.id !== id) }))

  const updateStep = (id: string, text: string) =>
    setDraft((d) => ({ ...d, steps: d.steps.map((s) => (s.id === id ? { ...s, text } : s)) }))
  const addStep = () => setDraft((d) => ({ ...d, steps: [...d.steps, toStep('')] }))
  const removeStep = (id: string) =>
    setDraft((d) => ({ ...d, steps: d.steps.filter((s) => s.id !== id) }))

  const removeTag = (label: string) =>
    setDraft((d) => ({ ...d, tags: d.tags.filter((t) => t.label !== label) }))

  return (
    <div className="add-form">
      <div>
        <div className="mono field-label" style={{ marginBottom: 8 }}>
          RECIPE NAME
        </div>
        <input
          className="field"
          placeholder="e.g. Sesame Cucumber Salad"
          value={draft.name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <div className="mono field-label" style={{ marginBottom: 8 }}>
          PHOTO URL
        </div>
        <input
          className="field"
          placeholder="https://…/photo.jpg"
          value={draft.heroImageUrl ?? ''}
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          onChange={(e) => setHeroImageUrl(e.target.value)}
        />
        {draft.heroImageUrl?.trim() && (
          <div className="img-preview">
            <PhotoPlaceholder
              bg={draft.photoBg}
              src={draft.heroImageUrl.trim()}
              radius={14}
              caption="PREVIEW"
              alt="Recipe photo preview"
            />
          </div>
        )}
      </div>

      <div className="two-col">
        <div>
          <div className="mono field-label" style={{ marginBottom: 8 }}>
            SERVINGS
          </div>
          <div className="stepper">
            <button className="stepper-btn stepper-minus" aria-label="Fewer servings" onClick={() => bumpServings(-1)}>
              −
            </button>
            <span className="mono stepper-value">{draft.servings}</span>
            <button className="stepper-btn stepper-plus" aria-label="More servings" onClick={() => bumpServings(1)}>
              +
            </button>
          </div>
        </div>
        <div>
          <div className="mono field-label" style={{ marginBottom: 8 }}>
            TIME
          </div>
          <input
            className="field"
            placeholder="e.g. 30 min"
            value={draft.time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>

      <div>
        <div className="mono field-label" style={{ marginBottom: 9 }}>
          INGREDIENTS
        </div>
        <div className="stack" style={{ gap: 8 }}>
          {draft.ingredients.map((ing) => (
            <div key={ing.id} className="ing-edit-row">
              <input
                className="ing-edit-q mono"
                placeholder="qty"
                value={ing.quantity}
                onChange={(e) => updateIng(ing.id, { quantity: e.target.value })}
              />
              <input
                className="ing-edit-n"
                placeholder="ingredient"
                value={ing.name}
                onChange={(e) => updateIng(ing.id, { name: e.target.value })}
              />
              <button className="row-btn row-btn-remove" aria-label="Remove ingredient" onClick={() => removeIng(ing.id)}>
                <MinusIcon size={15} />
              </button>
            </div>
          ))}
          <button className="ing-edit-row" onClick={addIng} style={{ background: 'none' }}>
            <span className="ing-edit-q mono" style={{ borderStyle: 'dashed', color: 'var(--placeholder-fg)' }}>
              qty
            </span>
            <span className="ing-edit-n" style={{ borderStyle: 'dashed', color: 'var(--placeholder-fg)' }}>
              ingredient
            </span>
            <span className="row-btn row-btn-add">
              <PlusIcon size={16} strokeWidth={2.4} />
            </span>
          </button>
        </div>
      </div>

      <div>
        <div className="mono field-label" style={{ marginBottom: 9 }}>
          INSTRUCTIONS
        </div>
        <div className="stack" style={{ gap: 8 }}>
          {draft.steps.map((step, i) => (
            <div key={step.id} className="step-edit-row">
              <span className="mono step-edit-badge">{i + 1}</span>
              <input
                className="step-edit-text"
                placeholder="Describe this step…"
                value={step.text}
                onChange={(e) => updateStep(step.id, e.target.value)}
              />
              <button
                className="row-btn row-btn-remove"
                style={{ marginTop: 4 }}
                aria-label="Remove step"
                onClick={() => removeStep(step.id)}
              >
                <MinusIcon size={15} />
              </button>
            </div>
          ))}
          <button className="step-edit-row" onClick={addStep} style={{ background: 'none', width: '100%' }}>
            <span className="mono step-edit-badge" style={{ borderStyle: 'dashed', background: 'transparent', color: 'var(--placeholder-fg)' }}>
              {draft.steps.length + 1}
            </span>
            <span
              className="step-edit-text"
              style={{ borderStyle: 'dashed', color: 'var(--placeholder-fg)' }}
            >
              Add a step…
            </span>
          </button>
        </div>
      </div>

      <div>
        <div className="mono field-label" style={{ marginBottom: 9 }}>
          TAGS
        </div>
        <div className="tag-edit-wrap">
          {draft.tags.map((t) => (
            <TagChip key={t.id} tag={t} size="md" onRemove={() => removeTag(t.label)} />
          ))}
          <button className="dashed-add" onClick={onAddTag}>
            <PlusIcon size={12} strokeWidth={2.6} />
            Add tag
          </button>
        </div>
      </div>
    </div>
  )
}

/* --------------------------------------------------------- tag picker modal */
function TagPickerDialog({
  open,
  onClose,
  allTags,
  selected,
  onToggle,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  allTags: Tag[]
  selected: Tag[]
  onToggle: (tag: Tag) => void
  onCreate: (label: string, hue: Hue) => void
}) {
  const [newLabel, setNewLabel] = useState('')
  const [newHue, setNewHue] = useState<Hue>('terra')

  const create = () => {
    const label = newLabel.trim()
    if (!label) return
    onCreate(label, newHue)
    setNewLabel('')
  }

  return (
    <Dialog open={open} onClose={onClose} label="Add tags">
      <div className="dialog-title">Tags</div>
      <div className="tag-edit-wrap" style={{ marginBottom: 18 }}>
        {allTags.map((t) => {
          const on = selected.some((s) => s.label === t.label)
          return (
            <button key={t.id} onClick={() => onToggle(t)} style={{ background: 'none' }}>
              <Chip label={t.label} hue={t.hue} size="md" filled={on} />
            </button>
          )
        })}
      </div>
      <div className="mono field-label" style={{ marginBottom: 8 }}>
        NEW TAG
      </div>
      <input
        className="field dialog-field"
        placeholder="Tag name"
        value={newLabel}
        onChange={(e) => setNewLabel(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && create()}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <HuePicker value={newHue} onChange={setNewHue} />
        <button className="round-btn round-btn-primary" aria-label="Create tag" onClick={create}>
          <CheckIcon size={18} strokeWidth={2.6} />
        </button>
      </div>
      <div className="dialog-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Done
        </button>
      </div>
    </Dialog>
  )
}
