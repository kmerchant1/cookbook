// The app shell. On phone widths this fills the viewport edge-to-edge; on larger
// screens it renders the design's phone mockup — a 390-ish-wide rounded frame
// with the signature card shadow, centered on the warm "board" background.

import type { ReactNode } from 'react'

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="board">
      <div className="frame">{children}</div>
    </div>
  )
}
