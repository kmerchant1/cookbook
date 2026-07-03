// Screen 3 — Recipe Detail (pushed). Hero, meta, ingredient checklist
// ("Check what you have"), numbered steps, bottom action bar, and the
// ••• edit/delete popover. (README §3)

import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import { displayToServings } from '../lib/format'
import { scaleFactor, scaleQuantity } from '../lib/scale'
import { ConfirmDialog } from '../components/Dialog'
import {
  BookmarkIcon,
  ChevronLeft,
  ClockIcon,
  CloseIcon,
  HeartIcon,
  PencilIcon,
  PotIcon,
  ServesIcon,
  ShareIcon,
  TrashIcon,
} from '../components/Icons'
import { Chip, Checkbox, PhotoPlaceholder } from '../components/primitives'

export function RecipeDetailScreen() {
  const { id } = useParams()
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const recipe = state.recipes.find((r) => r.id === id)

  // Cook-time servings scaler. Starts at the recipe's own yield; changing it
  // scales the ingredient amounts below (and carries into "Cook this").
  const baseServings = Math.max(1, displayToServings(recipe?.serves ?? ''))
  const [cookServings, setCookServings] = useState(baseServings)
  useEffect(() => {
    setCookServings(Math.max(1, displayToServings(recipe?.serves ?? '')))
    // Reset the scaler when navigating to a different recipe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe?.id])

  if (!recipe) return <Navigate to="/recipes" replace />

  const factor = scaleFactor(baseServings, cookServings)
  const scaled = cookServings !== baseServings

  const share = async () => {
    setMenuOpen(false)
    const text = [
      recipe.name,
      '',
      'Ingredients',
      ...recipe.ingredients.map((i) => `- ${[i.quantity, i.name].filter(Boolean).join(' ')}`),
      '',
      'Instructions',
      ...recipe.steps.map((s, i) => `${i + 1}. ${s.text}`),
    ].join('\n')
    try {
      if (navigator.share) {
        await navigator.share({ title: recipe.name, text })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
      }
    } catch {
      /* user cancelled share — no-op */
    }
  }

  const cookThis = () => {
    dispatch({ type: 'CLEAR_COOK_SELECT' })
    dispatch({ type: 'TOGGLE_COOK_SELECT', id: recipe.id })
    dispatch({ type: 'SET_COOK_SERVINGS', id: recipe.id, servings: cookServings })
    navigate('/cook/list')
  }

  return (
    <div className="screen">
      <div className="screen-scroll">
        <div className="hero">
          <PhotoPlaceholder
            bg={recipe.photoBg}
            hero
            caption="HERO PHOTO"
            src={recipe.heroImageUrl}
            alt={recipe.name}
          />
          <div className="hero-fade" />
          <div className="hero-nav">
            <button className="circle-btn" aria-label="Back" onClick={() => navigate(-1)}>
              <ChevronLeft />
            </button>
            <div className="hero-actions">
              <button
                className={`circle-btn ${recipe.favorite ? 'circle-btn-heart' : ''}`}
                aria-label={recipe.favorite ? 'Unfavorite' : 'Favorite'}
                onClick={() => dispatch({ type: 'TOGGLE_FAVORITE', id: recipe.id })}
              >
                <HeartIcon size={19} filled={recipe.favorite} strokeWidth={2} />
              </button>
              <button
                className="circle-btn"
                aria-label="More options"
                onClick={() => setMenuOpen(true)}
              >
                <span className="dots-3">
                  <span />
                  <span />
                  <span />
                </span>
              </button>
              <button
                className="circle-btn"
                aria-label="Close to recipes"
                onClick={() => navigate('/recipes')}
              >
                <CloseIcon size={19} />
              </button>
            </div>
          </div>
        </div>

        <div className="detail-body">
          <h1 className="detail-title">{recipe.name}</h1>
          <div className="detail-meta">
            {recipe.time && (
              <div className="meta-pill mono">
                <span className="icon-muted">
                  <ClockIcon />
                </span>
                {recipe.time}
              </div>
            )}
            {recipe.serves && (
              <div className="meta-pill mono">
                <span className="icon-muted">
                  <ServesIcon />
                </span>
                {recipe.serves}
              </div>
            )}
            {recipe.tags.map((t) => (
              <Chip key={t.id} label={t.label} hue={t.hue} size="md" />
            ))}
          </div>

          <div className="scale-card">
            <div className="scale-info">
              <div className="mono section-label">COOKING FOR</div>
              {scaled ? (
                <button className="scale-reset" onClick={() => setCookServings(baseServings)}>
                  Scaled from {baseServings} · reset
                </button>
              ) : (
                <div className="scale-sub">Scale the ingredient amounts</div>
              )}
            </div>
            <div className="scaler">
              <button
                className="scaler-btn scaler-minus"
                aria-label="Fewer servings"
                onClick={() => setCookServings((n) => Math.max(1, n - 1))}
              >
                −
              </button>
              <span className="mono scaler-value">{cookServings}</span>
              <button
                className="scaler-btn scaler-plus"
                aria-label="More servings"
                onClick={() => setCookServings((n) => Math.min(99, n + 1))}
              >
                +
              </button>
            </div>
          </div>

          <div className="detail-section-head">
            <div className="mono section-label">INGREDIENTS</div>
            <div className="hint">Check what you have</div>
          </div>
          <div className="checklist">
            {recipe.ingredients.map((ing) => (
              <button
                key={ing.id}
                className="checklist-row"
                onClick={() =>
                  dispatch({
                    type: 'TOGGLE_INGREDIENT_HAVE',
                    recipeId: recipe.id,
                    ingredientId: ing.id,
                  })
                }
              >
                <Checkbox
                  checked={!!ing.have}
                  onChange={() =>
                    dispatch({
                      type: 'TOGGLE_INGREDIENT_HAVE',
                      recipeId: recipe.id,
                      ingredientId: ing.id,
                    })
                  }
                  ariaLabel={ing.name}
                />
                <span className="mono checklist-q">{scaleQuantity(ing.quantity, factor)}</span>
                <span className="checklist-n">{ing.name}</span>
              </button>
            ))}
          </div>

          <div className="mono section-label" style={{ margin: '26px 0 14px' }}>
            INSTRUCTIONS
          </div>
          <div className="instructions">
            {recipe.steps.map((step, i) => (
              <div key={step.id} className="instruction-row">
                <span className="mono step-badge-lg">{i + 1}</span>
                <span className="instruction-text">{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="action-bar">
        <button
          className="round-btn round-btn-surface"
          style={{ width: 52, height: 52, borderRadius: 15 }}
          aria-label={recipe.favorite ? 'Remove bookmark' : 'Bookmark'}
          onClick={() => dispatch({ type: 'TOGGLE_FAVORITE', id: recipe.id })}
        >
          <BookmarkIcon />
        </button>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={cookThis}>
          <PotIcon size={21} strokeWidth={1.9} />
          Cook this
        </button>
      </div>

      {menuOpen && (
        <div className="scrim scrim-center" style={{ padding: 0 }} onClick={() => setMenuOpen(false)}>
          <div className="popover" onClick={(e) => e.stopPropagation()}>
            <button
              className="popover-item"
              onClick={() => {
                setMenuOpen(false)
                navigate(`/add/${recipe.id}`)
              }}
            >
              <PencilIcon size={19} />
              Edit recipe
            </button>
            <button className="popover-item" onClick={share}>
              <ShareIcon size={19} />
              Share
            </button>
            <button
              className="popover-item popover-item-danger"
              onClick={() => {
                setMenuOpen(false)
                setConfirmDelete(true)
              }}
            >
              <TrashIcon size={19} />
              Delete recipe
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete recipe?"
        message={`"${recipe.name}" will be removed from your cookbook. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          dispatch({ type: 'DELETE_RECIPE', id: recipe.id })
          navigate('/recipes')
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
