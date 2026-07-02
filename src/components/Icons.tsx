// Line-icon set, 1.8–2.2px stroke, round caps, currentColor — matched to the
// design's inline SVGs (README "Icons"). Each icon takes size + optional filled
// variants where the design uses them (heart, sun).

interface IconProps {
  size?: number
  className?: string
  strokeWidth?: number
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export function BookIcon({ size = 23, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  )
}

export function PotIcon({ size = 23, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M6 11 v3 a3 3 0 0 0 3 3 h6 a3 3 0 0 0 3 -3 v-3" />
      <line x1="4.5" y1="11" x2="19.5" y2="11" />
      <line x1="9.5" y1="4.5" x2="9.5" y2="7" />
      <line x1="14.5" y1="4.5" x2="14.5" y2="7" />
    </svg>
  )
}

export function ChecklistIcon({ size = 23, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M4 6.5 l1.3 1.3 L7.8 5" />
      <path d="M4 12 l1.3 1.3 L7.8 10.5" />
      <line x1="10.5" y1="6.5" x2="20" y2="6.5" />
      <line x1="10.5" y1="12" x2="20" y2="12" />
      <line x1="10.5" y1="17.5" x2="20" y2="17.5" />
      <line x1="4.5" y1="17.5" x2="6.5" y2="17.5" />
    </svg>
  )
}

export function SlidersIcon({ size = 23, strokeWidth = 1.8, barBg = 'var(--tab-bg)' }: IconProps & { barBg?: string }) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <line x1="4" y1="8.5" x2="20" y2="8.5" />
      <circle cx="15" cy="8.5" r="2.6" fill={barBg} />
      <line x1="4" y1="15.5" x2="20" y2="15.5" />
      <circle cx="9" cy="15.5" r="2.6" fill={barBg} />
    </svg>
  )
}

export function SearchIcon({ size = 18, strokeWidth = 1.9 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
      <circle cx="8.5" cy="8.5" r="5.5" />
      <line x1="13" y1="13" x2="17.5" y2="17.5" />
    </svg>
  )
}

export function PlusIcon({ size = 22, strokeWidth = 2.1 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
      <line x1="12" y1="6" x2="12" y2="18" />
      <line x1="6" y1="12" x2="18" y2="12" />
    </svg>
  )
}

export function MinusIcon({ size = 15, strokeWidth = 2.4 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
      <line x1="6" y1="12" x2="18" y2="12" />
    </svg>
  )
}

export function HeartIcon({ size = 15, filled = false, strokeWidth = 2 }: IconProps & { filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
    >
      <path d="M12 20C12 20 4 14.5 4 8.8A3.8 3.8 0 0 1 12 6.5A3.8 3.8 0 0 1 20 8.8C20 14.5 12 20 12 20Z" />
    </svg>
  )
}

export function CheckIcon({ size = 14, strokeWidth = 3 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

export function ChevronLeft({ size = 19, strokeWidth = 2.2 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}

export function ChevronRight({ size = 17, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

export function ArrowRight({ size = 19, strokeWidth = 2.2 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  )
}

export function CloseIcon({ size = 17, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="9" />
      <line x1="9" y1="9" x2="15" y2="15" />
      <line x1="15" y1="9" x2="9" y2="15" />
    </svg>
  )
}

export function XIcon({ size = 13, strokeWidth = 2.4 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  )
}

export function PencilIcon({ size = 18, strokeWidth = 1.9 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2 2 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

export function TrashIcon({ size = 19, strokeWidth = 1.9 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    </svg>
  )
}

export function ShareIcon({ size = 19, strokeWidth = 1.9 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v13" />
    </svg>
  )
}

export function BookmarkIcon({ size = 21, strokeWidth = 1.9 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z" />
    </svg>
  )
}

export function ClockIcon({ size = 13, strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

export function ServesIcon({ size = 13, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M4 20a8 8 0 0 1 16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function SpinnerIcon({ size = 40, strokeWidth = 2.2, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      className={className}
    >
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  )
}

export function WarningIcon({ size = 26, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M12 8v5" />
      <circle cx="12" cy="16.5" r="0.4" fill="currentColor" stroke="currentColor" />
      <path d="M10.3 3.9 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  )
}

export function RetryIcon({ size = 15, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}

export function DragHandleIcon({ size = 15, strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
      <line x1="5" y1="9" x2="19" y2="9" />
      <line x1="5" y1="15" x2="19" y2="15" />
    </svg>
  )
}

export function SunIcon({ size = 15, strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
      <circle cx="12" cy="12" r="4.5" fill="currentColor" />
      <line x1="12" y1="2.5" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="21.5" />
      <line x1="2.5" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="21.5" y2="12" />
    </svg>
  )
}

export function MoonIcon({ size = 15, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={strokeWidth}>
      <path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10Z" />
    </svg>
  )
}
