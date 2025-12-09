"use client"

import { useState, useCallback } from "react"
import { useSkirmishStore } from "@/lib/game-modes/skirmish/skirmish-store"
import { SkirmishBuyingPhase } from "./skirmish-buying-phase"
import { SkirmishGameCanvas } from "./skirmish-game-canvas"
import { SkirmishBattleControls } from "./skirmish-battle-controls"
import { SkirmishGameOver } from "./skirmish-game-over"
import { SkirmishAITurn } from "./skirmish-ai-turn"
import { ValueOverlay } from "@/components/value-overlay"
import { BaseDrawer } from "@/components/base-drawer"

export function SkirmishGame() {
  const { phase, tanks, currentTankIndex } = useSkirmishStore()
  const currentTank = tanks[currentTankIndex]

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
      {phase === "buying" && <SkirmishBuyingPhase />}

      {(phase === "battle" || phase === "turnEnd") && (
        <div className="relative h-full w-full">
          {/* Full screen battle viewport */}
          <div className="absolute inset-0">
            <SkirmishGameCanvas />
            <ValueOverlay value={displayValue} label={overlayLabel} />
          </div>

          {/* Base Drawer overlay */}
          <BaseDrawer contentHeight={200}>
            {currentTank?.isAI ? <SkirmishAITurn /> : <SkirmishBattleControls onOverlayChange={handleOverlayChange} />}
          </BaseDrawer>
        </div>
      )}

      {phase === "gameOver" && <SkirmishGameOver />}
    </>
  )
}

