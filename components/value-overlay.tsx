"use client"

import { useEffect, useState } from "react"

interface ValueOverlayProps {
  value: string | null
  label: string | null
}

export function ValueOverlay({ value, label }: ValueOverlayProps) {
  const [visible, setVisible] = useState(false)
  const [displayValue, setDisplayValue] = useState<string | null>(null)
  const [displayLabel, setDisplayLabel] = useState<string | null>(null)

  useEffect(() => {
    if (value !== null) {
      setDisplayValue(value)
      setDisplayLabel(label)
      setVisible(true)
    } else {
      // Fade out after a short delay
      const timer = setTimeout(() => {
        setVisible(false)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [value, label])

  if (!displayValue) return null

  return (
    <div
      className={`absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none z-10 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="bg-black/40 backdrop-blur-sm rounded-full px-5 py-2.5 flex items-center gap-2">
        <span className="text-white/60 text-xs uppercase tracking-wide">{displayLabel}</span>
        <span className="text-white font-mono text-sm font-semibold tabular-nums">{displayValue}</span>
      </div>
    </div>
  )
}
