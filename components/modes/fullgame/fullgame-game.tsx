"use client"

import { useState, useCallback } from "react"
import { useFullGameStore } from "@/lib/game-modes/fullgame/fullgame-store"
import { FullGameGameCanvas } from "./fullgame-game-canvas"
import { FullGameBattleControls } from "./fullgame-battle-controls"
import { ValueOverlay } from "@/components/value-overlay"
import { BaseDrawer } from "@/components/base-drawer"
import { GridLabels } from "./grid-system"

export function FullGameGame() {
  const { phase, tanks } = useFullGameStore()
  const currentTank = tanks[0] // Player tank

  const [overlayValue, setOverlayValue] = useState<string | null>(null)
  const [overlayLabel, setOverlayLabel] = useState<string | null>(null)

  const handleOverlayChange = useCallback((value: string | null, label: string | null) => {
    setOverlayValue(value)
    setOverlayLabel(label)
  }, [])

  const currentAngle = currentTank?.angle
  const currentPower = currentTank?.power

  const displayValue =
    overlayValue !== null ? (overlayLabel === "angle" ? `${currentAngle}°` : `${currentPower}%`) : null

  return (
    <>
      {phase === "battle" && (
        <div className="relative h-full w-full">
          {/* Full screen battle viewport */}
          <div className="absolute inset-0">
            <FullGameGameCanvas />
            <ValueOverlay value={displayValue} label={overlayLabel} />
          </div>


          {/* Base Drawer overlay */}
          <BaseDrawer contentHeight={200}>
            <FullGameBattleControls onOverlayChange={handleOverlayChange} />
          </BaseDrawer>
        </div>
      )}
    </>
  )
}

