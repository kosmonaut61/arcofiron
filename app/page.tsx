"use client"

import { useBaseGameStore } from "@/lib/base-game-store"
import { MainMenu } from "@/components/main-menu"
import { SkirmishGame } from "@/components/modes/skirmish/skirmish-game"
import { FullGameGame } from "@/components/modes/fullgame/fullgame-game"

export default function IronArc() {
  const { phase, gameMode } = useBaseGameStore()

  return (
    <div className="h-dvh w-full max-w-md mx-auto bg-background flex flex-col overflow-hidden">
      {phase === "menu" && <MainMenu />}

      {phase !== "menu" && gameMode === "skirmish" && <SkirmishGame />}
      {phase !== "menu" && gameMode === "fullgame" && <FullGameGame />}
    </div>
  )
}
