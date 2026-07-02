// Cosmetic status bar (StatusBar.dc.html): 9:41 left, signal + battery right.
// Real on device via Capacitor's safe-area insets; decorative on web.

export function StatusBar() {
  return (
    <div className="statusbar">
      <div className="statusbar-time mono">9:41</div>
      <div className="statusbar-icons">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden>
          <rect x="0" y="7" width="3" height="5" rx="1" fill="currentColor" />
          <rect x="5" y="4.5" width="3" height="7.5" rx="1" fill="currentColor" />
          <rect x="10" y="2" width="3" height="10" rx="1" fill="currentColor" />
          <rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor" opacity="0.3" />
        </svg>
        <svg width="28" height="13" viewBox="0 0 28 13" fill="none" aria-hidden>
          <rect x="0.6" y="0.6" width="22" height="11.8" rx="3.2" stroke="currentColor" strokeOpacity="0.4" />
          <rect x="2.4" y="2.4" width="15" height="8.2" rx="1.6" fill="currentColor" />
          <path d="M25 4.2 C26.4 5 26.4 8 25 8.8 Z" fill="currentColor" opacity="0.5" />
        </svg>
      </div>
    </div>
  )
}
