"use client"

import { useState, useCallback } from "react"
import { useGameStore } from "@/lib/game-store"
import { MainMenu } from "@/components/main-menu"
import { BuyingPhase } from "@/components/buying-phase"
import { GameCanvas } from "@/components/game-canvas"
import { BattleControls } from "@/components/battle-controls"
import { GameOver } from "@/components/game-over"
import { AITurn } from "@/components/ai-turn"
import { ValueOverlay } from "@/components/value-overlay"
import { BaseDrawer } from "@/components/base-drawer"
import { WindHUD } from "@/components/wind-hud"

export default function IronArc() {
  const { phase, tanks, currentTankIndex } = useGameStore()
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
    <div className="h-dvh w-full max-w-md mx-auto bg-background flex flex-col overflow-hidden">
      {phase === "menu" && <MainMenu />}

      {phase === "buying" && <BuyingPhase />}

      {(phase === "battle" || phase === "turnEnd") && (
        <div className="relative h-full w-full">
          {/* Full screen battle viewport */}
          <div className="absolute inset-0">
            <GameCanvas />
            <WindHUD />
            <ValueOverlay value={displayValue} label={overlayLabel} />
          </div>

          {/* Base Drawer overlay */}
          <BaseDrawer contentHeight={200}>
            {currentTank?.isAI ? <AITurn /> : <BattleControls onOverlayChange={handleOverlayChange} />}
          </BaseDrawer>
        </div>
      )}

      {phase === "gameOver" && <GameOver />}
    </div>
  )
}
