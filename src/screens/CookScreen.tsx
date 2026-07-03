// Screen 4a — Cook Today (select recipes). Pick one or more recipes; the action
// bar combines their ingredients into a shopping list. (README §4)

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import { darkPhotoTint } from '../lib/format'
import { StatusBar } from '../components/StatusBar'
import { TabBar } from '../components/TabBar'
import { ArrowRight, CheckIcon, PotIcon } from '../components/Icons'

export function CookScreen() {
  const { state, dispatch, resolvedTheme } = useApp()
  const navigate = useNavigate()
  const selectedCount = state.selectedForCook.length
  const tint = (bg: string) => (resolvedTheme === 'dark' ? darkPhotoTint(bg) : bg)

  return (
    <div className="screen">
      <StatusBar />
      <div className="screen-scroll">
        <header className="screen-header" style={{ display: 'block' }}>
          <div className="screen-title">Cook today</div>
          <div className="screen-subtitle">Pick recipes — we'll combine their ingredients.</div>
        </header>

        {state.recipes.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: 40 }}>
            <div className="empty-tile">
              <PotIcon size={48} strokeWidth={1.6} />
            </div>
            <div className="empty-title">Nothing to cook yet</div>
            <div className="empty-sub">Save a few recipes and they'll show up here to combine.</div>
            <button className="btn btn-primary btn-block" onClick={() => navigate('/add')}>
              Add a recipe
            </button>
          </div>
        ) : (
          <div className="cook-list">
            {state.recipes.map((r) => {
              const on = state.selectedForCook.includes(r.id)
              return (
                <button
                  key={r.id}
                  className={`cook-row ${on ? 'cook-row-on' : ''}`}
                  onClick={() => dispatch({ type: 'TOGGLE_COOK_SELECT', id: r.id })}
                >
                  <CookThumb bg={tint(r.photoBg)} src={r.heroImageUrl} />
                  <div className="spacer" style={{ textAlign: 'left' }}>
                    <div className="cook-row-title">{r.name}</div>
                    <div className="mono cook-row-meta">
                      {r.time}
                      {r.time && r.serves ? ' · ' : ''}
                      {r.serves}
                    </div>
                  </div>
                  <span className={`select-circle ${on ? 'select-circle-on' : ''}`}>
                    {on && <CheckIcon size={15} />}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {state.recipes.length > 0 && (
        <div className="action-bar">
          <button
            className="btn btn-primary btn-block"
            disabled={selectedCount === 0}
            onClick={() => navigate('/cook/list')}
          >
            {selectedCount === 0
              ? 'Select recipes to combine'
              : `Combine ${selectedCount} recipe${selectedCount === 1 ? '' : 's'}`}
            {selectedCount > 0 && <ArrowRight size={19} />}
          </button>
        </div>
      )}
      <TabBar />
    </div>
  )
}

/** Small recipe thumbnail: loaded photo if present, else the striped tint. */
function CookThumb({ bg, src }: { bg: string; src?: string }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  return (
    <div className="cook-thumb" style={{ background: bg }}>
      {src && !failed ? (
        <img className="photo-img" src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <div className="photo-stripe" />
      )}
    </div>
  )
}
