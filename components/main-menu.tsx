"use client"

import { useState, useRef, useEffect } from "react"
import { useBaseGameStore } from "@/lib/base-game-store"
import { useSkirmishStore } from "@/lib/game-modes/skirmish/skirmish-store"
import { Button } from "@/components/ui/button"
import { getRandomGradientColors, generateGradientBands } from "@/lib/gradient-utils"
import { ModeSelector } from "@/components/mode-selector"

export function MainMenu() {
  const { gameMode, setGameMode, setPhase } = useBaseGameStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [gradientColors] = useState(() => getRandomGradientColors())

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = container.clientWidth
    const height = container.clientHeight

    canvas.width = width
    canvas.height = height

    // Draw stepped gradient sky
    const bands = generateGradientBands(gradientColors, 11)
    const bandHeight = height / bands.length

    bands.forEach((color, i) => {
      ctx.fillStyle = color
      ctx.fillRect(0, i * bandHeight, width, bandHeight + 1)
    })
  }, [gradientColors])

  const handleStartGame = () => {
    if (!gameMode) return
    
    // Initialize the appropriate game mode
    if (gameMode === "skirmish") {
      useSkirmishStore.getState().initGame()
      setPhase("buying")
    }
  }

  const handleBack = () => {
    setGameMode(null)
  }

  return (
    <div ref={containerRef} className="relative flex flex-col items-center justify-center h-full gap-8 p-8">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ imageRendering: "pixelated" }} />

      <div className="relative z-10 flex flex-col items-center justify-center px-8 py-12 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl">
        <div className="flex flex-col items-center gap-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-medium tracking-widest text-white">arc of iron</h1>
            <p className="text-sm text-white/80 tracking-wide">artillery warfare</p>
          </div>

          <div className="w-24 h-px bg-white/40" />

          {!gameMode ? (
            <>
              <ModeSelector />
            </>
          ) : (
            <>
              <div className="space-y-3 text-center text-xs text-white/70 max-w-[200px]">
                <p>aim your cannon</p>
                <p>adjust your power</p>
                <p>destroy your enemy</p>
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Button onClick={handleStartGame} className="px-8 bg-white/20 hover:bg-white/30 text-white border border-white/30">
                  start game
                </Button>
                <Button onClick={handleBack} variant="ghost" className="px-8 text-white/70 hover:text-white hover:bg-white/10">
                  back
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="absolute bottom-8 text-xs text-white/60 z-10">inspired by scorched earth</div>
    </div>
  )
}
