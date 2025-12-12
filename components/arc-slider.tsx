"use client"

import type React from "react"

import { useRef, useCallback } from "react"

interface ArcSliderProps {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  label: string
  unit: string
  disabled?: boolean
  onDragStart?: () => void
  onDragEnd?: () => void
  inverted?: boolean
}

export function ArcSlider({
  value,
  min,
  max,
  onChange,
  label,
  unit,
  disabled,
  onDragStart,
  onDragEnd,
  inverted = false,
}: ArcSliderProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const isDragging = useRef(false)

  const width = 110
  const height = 50
  const strokeWidth = 6
  const handleRadius = 8

  const radius = 45
  const centerX = width / 2
  const centerY = height + 15

  const startAngleDeg = -150
  const endAngleDeg = -30
  const startAngle = (startAngleDeg * Math.PI) / 180
  const endAngle = (endAngleDeg * Math.PI) / 180

  const valueToAngle = (val: number) => {
    let normalized = (val - min) / (max - min)
    if (inverted) normalized = 1 - normalized
    return startAngle + normalized * (endAngle - startAngle)
  }

  const currentAngle = valueToAngle(value)
  const handleX = centerX + radius * Math.cos(currentAngle)
  const handleY = centerY + radius * Math.sin(currentAngle)

  const startX = centerX + radius * Math.cos(startAngle)
  const startY = centerY + radius * Math.sin(startAngle)
  const endX = centerX + radius * Math.cos(endAngle)
  const endY = centerY + radius * Math.sin(endAngle)

  const trackPath = `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`
  const filledPath = inverted
    ? `M ${handleX} ${handleY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`
    : `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${handleX} ${handleY}`

  const handleInteraction = useCallback(
    (clientX: number, clientY: number) => {
      if (disabled || !svgRef.current) return

      const rect = svgRef.current.getBoundingClientRect()
      const x = clientX - rect.left - centerX
      const y = clientY - rect.top - centerY

      let angle = Math.atan2(y, x)

      if (angle < startAngle) angle = startAngle
      if (angle > endAngle) angle = endAngle

      let normalized = (angle - startAngle) / (endAngle - startAngle)
      if (inverted) normalized = 1 - normalized
      const newValue = Math.round(min + normalized * (max - min))
      const clampedValue = Math.max(min, Math.min(max, newValue))
      onChange(clampedValue)
    },
    [disabled, min, max, onChange, centerX, centerY, startAngle, endAngle, inverted],
  )

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return
    isDragging.current = true
    ;(e.target as Element).setPointerCapture(e.pointerId)
    onDragStart?.()
    handleInteraction(e.clientX, e.clientY)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    handleInteraction(e.clientX, e.clientY)
  }

  const handlePointerUp = () => {
    if (isDragging.current) {
      onDragEnd?.()
    }
    isDragging.current = false
  }

  return (
    <div className={`flex flex-col items-center ${disabled ? "opacity-50" : ""}`}>
      <span className="text-[9px] uppercase tracking-widest text-white/70">{label}</span>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="cursor-pointer touch-none overflow-visible"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <path d={trackPath} fill="none" stroke="white" strokeWidth={strokeWidth} strokeLinecap="round" opacity={0.3} />
        <path d={filledPath} fill="none" stroke="white" strokeWidth={strokeWidth} strokeLinecap="round" opacity={0.7} />
        <circle cx={handleX} cy={handleY} r={handleRadius} fill="#1a1a1a" stroke="white" strokeWidth={2} />
      </svg>
      <span className="text-sm font-medium -mt-1 text-white">
        {value}
        {unit}
      </span>
    </div>
  )
}
