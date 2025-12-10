"use client"

import { useSkirmishStore } from "@/lib/game-modes/skirmish/skirmish-store"
import { useBaseGameStore } from "@/lib/base-game-store"
import { Button } from "@/components/ui/button"

export function SkirmishGameOver() {
  const { winner } = useSkirmishStore()
  const { reset } = useBaseGameStore()

  const handlePlayAgain = () => {
    reset()
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-medium tracking-wide">game over</h2>
        <p className="text-muted-foreground">{winner ? `${winner.name} wins!` : "draw"}</p>
      </div>

      {winner && (
        <div className="p-4 bg-card rounded-lg border border-border">
          <div className="text-sm text-muted-foreground">final score</div>
          <div className="text-3xl font-medium">${winner.money}</div>
        </div>
      )}

      <Button onClick={handlePlayAgain}>play again</Button>
    </div>
  )
}

