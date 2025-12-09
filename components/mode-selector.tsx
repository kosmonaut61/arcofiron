"use client"

import { useBaseGameStore } from "@/lib/base-game-store"
import { GAME_MODES, type GameMode } from "@/lib/game-modes/types"
import { Button } from "@/components/ui/button"

export function ModeSelector() {
  const { setGameMode, setPhase } = useBaseGameStore()

  const handleSelectMode = (mode: GameMode) => {
    setGameMode(mode)
    setPhase("menu") // Stay on menu, but now with mode selected
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-center space-y-1">
        <p className="text-sm text-white/80 tracking-wide">select game mode</p>
      </div>

      <div className="flex flex-col gap-2">
        {GAME_MODES.map((mode) => (
          <Button
            key={mode.id}
            onClick={() => handleSelectMode(mode.id)}
            className="w-full justify-start px-4 py-3 h-auto bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            <div className="flex flex-col items-start gap-1">
              <span className="text-sm font-medium">{mode.name}</span>
              <span className="text-xs text-white/70 text-left">{mode.description}</span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  )
}

