"use client"

import { CANVAS_WIDTH, SCROLL_PADDING, TOTAL_WIDTH } from "@/lib/game-modes/fullgame/fullgame-store"

const GRID_ROWS = 8 // A-H
const GRID_COLS = 8 // 1-8
const TOTAL_SEGMENTS = GRID_ROWS * GRID_COLS // 64 segments total
const SEGMENT_WIDTH = CANVAS_WIDTH / TOTAL_SEGMENTS // 1600 / 64 = 25 pixels per segment

export function getGridLabel(x: number): string {
  // Convert game X coordinate to grid label
  // x is in game coordinates (0 to CANVAS_WIDTH)
  const segmentIndex = Math.floor(x / SEGMENT_WIDTH)
  const col = (segmentIndex % GRID_COLS) + 1
  const row = Math.floor(segmentIndex / GRID_COLS)
  
  if (row >= GRID_ROWS) return "H" + col
  const rowLetter = String.fromCharCode(65 + row) // A=65, B=66, etc.
  return rowLetter + col
}

export function getGridSegmentBounds(segmentLabel: string): { minX: number; maxX: number } {
  // Parse label like "A1" or "H16"
  const rowLetter = segmentLabel[0]
  const col = Number.parseInt(segmentLabel.slice(1))
  
  const row = rowLetter.charCodeAt(0) - 65 // A=0, B=1, etc.
  const segmentIndex = row * GRID_COLS + (col - 1)
  
  return {
    minX: segmentIndex * SEGMENT_WIDTH,
    maxX: (segmentIndex + 1) * SEGMENT_WIDTH,
  }
}

export function GridLabels() {
  const segments: string[] = []
  
  // Generate all segment labels A1-H8
  for (let row = 0; row < GRID_ROWS; row++) {
    const rowLetter = String.fromCharCode(65 + row) // A-H
    for (let col = 1; col <= GRID_COLS; col++) {
      segments.push(rowLetter + col)
    }
  }

  return (
    <div className="relative w-full h-full pointer-events-none">
      <div className="h-full bg-black/40 backdrop-blur-sm">
        <div className="relative h-full flex items-center" style={{ width: TOTAL_WIDTH }}>
          {segments.map((label, index) => {
            const left = index * SEGMENT_WIDTH + SCROLL_PADDING
            return (
              <div
                key={label}
                className="absolute h-full flex items-center justify-center"
                style={{
                  left: `${left}px`,
                  width: `${SEGMENT_WIDTH}px`,
                }}
              >
                <span className="text-[10px] text-white/80 font-mono select-none font-medium">{label}</span>
              </div>
            )
          })}
          {/* Ticks between segments */}
          {segments.map((_, index) => {
            if (index === segments.length - 1) return null
            const tickLeft = (index + 1) * SEGMENT_WIDTH + SCROLL_PADDING
            return (
              <div
                key={`tick-${index}`}
                className="absolute top-0 bottom-0 w-px bg-white/25"
                style={{
                  left: `${tickLeft}px`,
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

