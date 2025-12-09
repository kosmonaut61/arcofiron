"use client"

import { useEffect, useRef } from "react"
import { useGameStore, CANVAS_WIDTH, CANVAS_HEIGHT, SCROLL_PADDING } from "@/lib/game-store"

function simulateShot(
  startX: number,
  startY: number,
  angle: number,
  power: number,
  wind: number,
  terrain: number[],
  tankIndex: number, // Use tank index to match actual firing logic
): { hitX: number; hitY: number } {
  const visualAngle = 180 - angle
  const angleRad = (visualAngle * Math.PI) / 180
  const speed = power * 0.15
  // This matches: currentTankIndex === 0 ? 1 : -1 in fireProjectile
  const direction = tankIndex === 0 ? 1 : -1

  let x = startX
  let y = startY - 5
  let vx = Math.cos(angleRad) * speed * direction
  let vy = -Math.sin(angleRad) * speed

  const gravity = 0.15
  const windEffect = wind * 0.02
  const maxIterations = 2000

  for (let i = 0; i < maxIterations; i++) {
    x += vx
    y += vy
    vx += windEffect
    vy += gravity

    const terrainIndex = Math.floor(x) + SCROLL_PADDING
    const terrainY = terrain[terrainIndex] ?? CANVAS_HEIGHT

    const leftBound = -SCROLL_PADDING
    const rightBound = CANVAS_WIDTH + SCROLL_PADDING

    // Check if hit terrain or out of bounds
    if (y >= terrainY || x < leftBound || x >= rightBound || y > CANVAS_HEIGHT) {
      return { hitX: x, hitY: Math.min(y, terrainY) }
    }
  }

  return { hitX: x, hitY: y }
}

function calculatePerfectShot(
  aiX: number,
  aiY: number,
  targetX: number,
  targetY: number,
  wind: number,
  terrain: number[],
  tankIndex: number, // Pass tank index
): { angle: number; power: number } {
  let bestAngle = 45
  let bestPower = 50
  let bestDistance = Number.POSITIVE_INFINITY

  for (let angle = 10; angle <= 170; angle += 3) {
    for (let power = 20; power <= 100; power += 5) {
      const result = simulateShot(aiX, aiY, angle, power, wind, terrain, tankIndex)
      const distance = Math.abs(result.hitX - targetX)

      if (distance < bestDistance) {
        bestDistance = distance
        bestAngle = angle
        bestPower = power
      }
    }
  }

  // Fine-tune with smaller steps
  for (let angle = bestAngle - 5; angle <= bestAngle + 5; angle += 1) {
    for (let power = bestPower - 5; power <= bestPower + 5; power += 1) {
      if (angle < 5 || angle > 175 || power < 20 || power > 100) continue

      const result = simulateShot(aiX, aiY, angle, power, wind, terrain, tankIndex)
      const distance = Math.abs(result.hitX - targetX)

      if (distance < bestDistance) {
        bestDistance = distance
        bestAngle = angle
        bestPower = power
      }
    }
  }

  console.log("[v0] Best shot found:", { bestAngle, bestPower, bestDistance, targetX })

  return { angle: bestAngle, power: bestPower }
}

function generateMissVariants(perfectAngle: number, perfectPower: number): Array<{ angle: number; power: number }> {
  return [
    // Undershoot variants
    { angle: perfectAngle - 8 - Math.random() * 5, power: perfectPower - 10 - Math.random() * 10 },
    { angle: perfectAngle + 5 + Math.random() * 5, power: perfectPower - 15 - Math.random() * 10 },
    // Overshoot variants
    { angle: perfectAngle - 5 - Math.random() * 5, power: perfectPower + 10 + Math.random() * 10 },
    { angle: perfectAngle + 8 + Math.random() * 5, power: perfectPower + 15 + Math.random() * 10 },
  ].map(({ angle, power }) => ({
    angle: Math.max(10, Math.min(170, angle)),
    power: Math.max(20, Math.min(100, power)),
  }))
}

export function AITurn() {
  const { tanks, currentTankIndex, updateTank, fireProjectile, isProcessingShot, phase, turnId, terrain, wind } =
    useGameStore()
  const lastFiredTurnId = useRef<number>(-1)

  const currentTank = tanks[currentTankIndex]
  const isAITurn = currentTank?.isAI && phase === "battle" && !isProcessingShot

  useEffect(() => {
    if (!isAITurn) return

    if (lastFiredTurnId.current === turnId) return
    lastFiredTurnId.current = turnId

    const timer = setTimeout(() => {
      const player = tanks.find((t) => t.id === "player")
      if (!player || !currentTank) return

      console.log("[v0] AI calculating shot:", {
        aiX: currentTank.x,
        playerX: player.x,
        tankIndex: currentTankIndex,
        wind,
      })

      const perfect = calculatePerfectShot(
        currentTank.x,
        currentTank.y,
        player.x,
        player.y,
        wind,
        terrain,
        currentTankIndex,
      )

      const missVariants = generateMissVariants(perfect.angle, perfect.power)
      const allOptions = [perfect, ...missVariants]

      // Random selection: 20% chance to pick the perfect shot
      const selectedShot = allOptions[Math.floor(Math.random() * allOptions.length)]

      console.log("[v0] AI selected shot:", selectedShot)

      updateTank(currentTank.id, {
        angle: selectedShot.angle,
        power: selectedShot.power,
      })

      setTimeout(() => {
        fireProjectile()
      }, 500)
    }, 1000)

    return () => clearTimeout(timer)
  }, [isAITurn, turnId, currentTank, tanks, updateTank, fireProjectile, terrain, wind, currentTankIndex])

  return (
    <div className="flex flex-col px-4 py-2 gap-1 h-full">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">
          {isProcessingShot ? "firing..." : "enemy is calculating..."}
        </div>
      </div>
    </div>
  )
}
