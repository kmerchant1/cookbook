// Bottom tab navigator (TabBar.dc.html): 4 root screens, active item in
// terracotta with a bolder label. Pinned to the bottom of the phone frame.

import { NavLink } from 'react-router-dom'
import { BookIcon, ChecklistIcon, PotIcon, SlidersIcon } from './Icons'

const TABS = [
  { to: '/recipes', label: 'Recipes', Icon: BookIcon },
  { to: '/cook', label: 'Cook', Icon: PotIcon },
  { to: '/grocery', label: 'Grocery', Icon: ChecklistIcon },
  { to: '/settings', label: 'Settings', Icon: SlidersIcon },
] as const

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Primary">
      {TABS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}
        >
          <Icon size={23} />
          <span className="tab-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
