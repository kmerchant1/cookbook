import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { readAppearanceEarly } from './lib/storage'
import { applyAppearance } from './state/theme'

// Paint the persisted theme before React mounts to avoid a light-mode flash.
applyAppearance(readAppearanceEarly())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
