"use client"

import { useEffect, useRef, useState } from "react"
import { SCROLL_PADDING, TOTAL_WIDTH } from "@/lib/game-modes/fullgame/fullgame-store"

// Define constants locally to avoid import issues
const CANVAS_WIDTH = 1600 // Match fullgame-store value
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
  const gridRef = useRef<HTMLDivElement>(null)
  const [drawerHeight, setDrawerHeight] = useState(232) // Default: 200 content + 32 handle
  const segments: string[] = []
  
  // Generate all segment labels A1-H8 (for calculating tick positions)
  for (let row = 0; row < GRID_ROWS; row++) {
    const rowLetter = String.fromCharCode(65 + row) // A-H
    for (let col = 1; col <= GRID_COLS; col++) {
      segments.push(rowLetter + col)
    }
  }

  // Observe drawer height changes
  useEffect(() => {
    const findDrawer = (): HTMLElement | null => {
      // Find the BaseDrawer element by looking for the element with the drawer styling
      const drawers = document.querySelectorAll('[class*="rounded-t-2xl"][class*="border-t"]')
      for (const drawer of drawers) {
        if (drawer instanceof HTMLElement && drawer.style.height) {
          return drawer
        }
      }
      return null
    }

    const updateDrawerHeight = () => {
      const drawer = findDrawer()
      if (drawer) {
        const height = drawer.offsetHeight
        setDrawerHeight(height)
      }
    }

    // Initial check
    const timeout = setTimeout(updateDrawerHeight, 100)

    // Watch for drawer changes using ResizeObserver
    const drawer = findDrawer()
    if (drawer) {
      const resizeObserver = new ResizeObserver(() => {
        updateDrawerHeight()
      })
      resizeObserver.observe(drawer)

      // Also listen for transition end in case ResizeObserver doesn't catch it
      drawer.addEventListener('transitionend', updateDrawerHeight)

      return () => {
        resizeObserver.disconnect()
        drawer.removeEventListener('transitionend', updateDrawerHeight)
        clearTimeout(timeout)
      }
    }

    return () => clearTimeout(timeout)
  }, [])

  return (
    <div 
      ref={gridRef}
      className="absolute inset-0 pointer-events-none" 
      style={{ bottom: `${drawerHeight}px` }}
    >
      {/* Full-height vertical ticks across battle view */}
      {segments.map((_, index) => {
        if (index === segments.length - 1) return null
        const tickLeft = (index + 1) * SEGMENT_WIDTH + SCROLL_PADDING
        return (
          <div
            key={`tick-${index}`}
            className="absolute top-0 bottom-0 w-px bg-white/30"
            style={{
              left: `${tickLeft}px`,
              mixBlendMode: "overlay",
            }}
          />
        )
      })}
    </div>
  )
}

