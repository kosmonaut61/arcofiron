"use client"

import { useGameStore } from "@/lib/game-store"

export function WindHUD() {
  const wind = useGameStore((state) => state.wind)

  const windArrow = wind > 0 ? "→" : "←"
  const windStrength = Math.abs(wind).toFixed(1)

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
      <div className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
        <span className="text-white font-mono text-sm">
          wind {windArrow} {windStrength}
        </span>
      </div>
    </div>
  )
}
