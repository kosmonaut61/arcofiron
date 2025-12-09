"use client"

import { useGameStore } from "@/lib/game-store"
import { Button } from "@/components/ui/button"

export function GameOver() {
  const { winner, initGame } = useGameStore()

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

      <Button onClick={initGame}>play again</Button>
    </div>
  )
}
