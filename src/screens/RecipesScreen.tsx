// Screen 1 — Recipe Library (home). Header + count, search, filter chips, 2-col
// grid, empty state, and search/filter-active results label. (README §1)

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import { filterRecipes } from '../state/selectors'
import { StatusBar } from '../components/StatusBar'
import { TabBar } from '../components/TabBar'
import {
  BookIcon,
  CloseIcon,
  HeartIcon,
  PlusIcon,
  SearchIcon,
} from '../components/Icons'
import { Chip, PhotoPlaceholder, hueClass } from '../components/primitives'

export function RecipesScreen() {
  const { state } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [favoritesOnly, setFavoritesOnly] = useState(false)

  const filtering = query.trim() !== '' || activeTag !== null || favoritesOnly
  const results = useMemo(
    () => filterRecipes(state.recipes, query, activeTag, favoritesOnly),
    [state.recipes, query, activeTag, favoritesOnly],
  )

  const isEmpty = state.recipes.length === 0

  return (
    <div className="screen">
      <StatusBar />
      <div className="screen-scroll">
        <header className="screen-header">
          <div>
            <div className="screen-title">Recipes</div>
            <div className="mono mono-count">{state.recipes.length} SAVED</div>
          </div>
          <button
            className="round-btn round-btn-primary"
            aria-label="Add recipe"
            onClick={() => navigate('/add')}
          >
            <PlusIcon size={22} />
          </button>
        </header>

        {isEmpty ? (
          <EmptyState onAdd={() => navigate('/add')} onImport={() => navigate('/add?method=link')} />
        ) : (
          <>
            <div style={{ padding: '16px 22px 0' }}>
              <div className={`searchbar ${focused ? 'searchbar-focused' : ''}`}>
                <span className="icon-muted">
                  <SearchIcon />
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Search recipes & ingredients"
                  aria-label="Search recipes and ingredients"
                />
                {query && (
                  <button
                    className="searchbar-clear"
                    aria-label="Clear search"
                    onClick={() => setQuery('')}
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>
            </div>

            <div className="filter-row">
              <button
                className={`filter-pill filter-pill-all ${!activeTag && !favoritesOnly ? 'filter-pill-on' : ''}`}
                onClick={() => {
                  setActiveTag(null)
                  setFavoritesOnly(false)
                }}
              >
                All
              </button>
              <button
                className={`filter-pill ${favoritesOnly ? 'filter-pill-on' : ''}`}
                onClick={() => setFavoritesOnly((v) => !v)}
              >
                <span className="heart">
                  <HeartIcon size={13} />
                </span>
                Favorites
              </button>
              {state.tags.map((tag) => {
                const on = activeTag === tag.label
                return (
                  <button
                    key={tag.id}
                    className={`filter-pill ${on ? `filter-pill-tag-on ${hueClass(tag.hue)}` : ''}`}
                    onClick={() => setActiveTag(on ? null : tag.label)}
                  >
                    {tag.label}
                    {on && <CloseIcon size={13} />}
                  </button>
                )
              })}
            </div>

            {filtering && (
              <div className="mono mono-count results-label">{results.length} RESULTS</div>
            )}

            {results.length === 0 ? (
              <NoResults />
            ) : (
              <div className="recipe-grid">
                {results.map((r) => (
                  <button
                    key={r.id}
                    className="recipe-card"
                    onClick={() => navigate(`/recipes/${r.id}`)}
                  >
                    <PhotoPlaceholder bg={r.photoBg}>
                      {r.favorite && (
                        <div className="fav-badge">
                          <HeartIcon size={15} filled />
                        </div>
                      )}
                    </PhotoPlaceholder>
                    <div className="stack" style={{ gap: 6 }}>
                      <div className="recipe-card-title">{r.name}</div>
                      <div className="mono meta">
                        {r.time}
                        {r.time && r.serves ? ' · ' : ''}
                        {r.serves}
                      </div>
                      <div className="recipe-card-tags">
                        {r.tags.map((t) => (
                          <Chip key={t.id} label={t.label} hue={t.hue} />
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <TabBar />
    </div>
  )
}

function EmptyState({ onAdd, onImport }: { onAdd: () => void; onImport: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-tile">
        <BookIcon size={52} strokeWidth={1.5} />
      </div>
      <div className="empty-title">Your cookbook is empty</div>
      <div className="empty-sub">
        Save your first recipe — paste it in, drop a link, or type it out by hand.
      </div>
      <div className="empty-actions">
        <button className="btn btn-primary btn-block" onClick={onAdd}>
          Add a recipe
        </button>
        <button className="btn btn-outline btn-block" onClick={onImport}>
          Import from a link
        </button>
      </div>
    </div>
  )
}

function NoResults() {
  return (
    <div style={{ padding: '40px 44px 60px', textAlign: 'center' }}>
      <div className="empty-title" style={{ fontSize: 18 }}>
        No matches
      </div>
      <div className="empty-sub" style={{ marginBottom: 0 }}>
        Try a different search or clear your filters.
      </div>
    </div>
  )
}
