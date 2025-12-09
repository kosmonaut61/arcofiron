"use client"

import { useEffect, useRef } from "react"
import { CANVAS_WIDTH, SCROLL_PADDING, TOTAL_WIDTH } from "@/lib/game-modes/fullgame/fullgame-store"

const GRID_ROWS = 8 // A-H
const GRID_COLS = 16 // 1-16
const SEGMENT_WIDTH = CANVAS_WIDTH / GRID_COLS // 100 pixels per segment

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
  const gridRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const segments: string[] = []
  
  // Generate all segment labels A1-H16
  for (let row = 0; row < GRID_ROWS; row++) {
    const rowLetter = String.fromCharCode(65 + row) // A-H
    for (let col = 1; col <= GRID_COLS; col++) {
      segments.push(rowLetter + col)
    }
  }

  // Sync scroll with canvas
  useEffect(() => {
    const findCanvasScrollContainer = (): HTMLElement | null => {
      // Find the canvas scroll container by data attribute or canvas parent
      const byData = document.querySelector('[data-grid-sync="true"]') as HTMLElement
      if (byData) return byData
      
      const canvas = document.querySelector(`canvas[width="${TOTAL_WIDTH}"]`)
      return canvas?.parentElement as HTMLElement | null
    }

    const gridScrollContainer = scrollContainerRef.current
    if (!gridScrollContainer) return

    // Retry with delay to ensure canvas is rendered
    const timeout = setTimeout(() => {
      const canvasScrollContainer = findCanvasScrollContainer()
      if (!canvasScrollContainer) return

      const handleScroll = () => {
        gridScrollContainer.scrollLeft = canvasScrollContainer.scrollLeft
      }

      // Initial sync
      handleScroll()

      canvasScrollContainer.addEventListener("scroll", handleScroll)
      
      // Also sync when grid scrolls (bidirectional)
      const handleGridScroll = () => {
        canvasScrollContainer.scrollLeft = gridScrollContainer.scrollLeft
      }
      gridScrollContainer.addEventListener("scroll", handleGridScroll)

      return () => {
        canvasScrollContainer.removeEventListener("scroll", handleScroll)
        gridScrollContainer.removeEventListener("scroll", handleGridScroll)
      }
    }, 200)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <div
      ref={gridRef}
      className="absolute bottom-[200px] left-0 right-0 z-20 pointer-events-none"
      style={{ height: "24px" }}
    >
      <div className="h-full bg-background/90 backdrop-blur-sm border-b border-border">
        <div
          ref={scrollContainerRef}
          className="w-full h-full overflow-x-auto overflow-y-hidden scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="relative h-full" style={{ width: TOTAL_WIDTH }}>
            {segments.map((label, index) => {
              const left = index * SEGMENT_WIDTH + SCROLL_PADDING
              return (
                <div
                  key={label}
                  className="absolute h-full flex items-center justify-center border-r border-border/30"
                  style={{
                    left: `${left}px`,
                    width: `${SEGMENT_WIDTH}px`,
                  }}
                >
                  <span className="text-[10px] text-muted-foreground font-mono select-none">{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

