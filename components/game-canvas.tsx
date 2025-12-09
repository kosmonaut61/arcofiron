"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useGameStore, SCROLL_PADDING, TOTAL_WIDTH } from "@/lib/game-store"
import { getRandomGradientColors, generateGradientBands } from "@/lib/gradient-utils"
import { WindHUD } from "@/components/wind-hud"

const VIEWPORT_WIDTH = 375 // Visible viewport width

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const hasScheduledNextTurn = useRef(false)
  const hasInitialScrolled = useRef(false) // Track if we've done initial scroll
  const [canvasHeight, setCanvasHeight] = useState(600)

  const [skyGradient] = useState(() => {
    const colors = getRandomGradientColors()
    return generateGradientBands(colors, 11)
  })

  const {
    terrain,
    tanks,
    projectile,
    subProjectiles,
    explosions,
    napalmParticles,
    tracerTrail,
    wind,
    currentTankIndex,
    phase,
    updateProjectile,
    updateSubProjectiles,
    updateExplosions,
    updateNapalm,
    nextTurn,
    checkGameOver,
    setProcessingShot,
    turnId,
  } = useGameStore()

  const currentTank = tanks[currentTankIndex]

  useEffect(() => {
    if (phase === "battle" && scrollContainerRef.current && currentTank && !hasInitialScrolled.current) {
      // Small delay to ensure canvas is rendered
      const timeoutId = setTimeout(() => {
        const scrollContainer = scrollContainerRef.current
        if (!scrollContainer) return

        const containerWidth = scrollContainer.clientWidth
        const tankCanvasX = currentTank.x + SCROLL_PADDING
        const targetScroll = tankCanvasX - containerWidth / 2

        scrollContainer.scrollTo({
          left: Math.max(0, Math.min(targetScroll, TOTAL_WIDTH - containerWidth)),
          behavior: "auto", // Instant scroll on initial load
        })
        hasInitialScrolled.current = true
      }, 50)

      return () => clearTimeout(timeoutId)
    }
  }, [phase, currentTank])

  useEffect(() => {
    if (phase !== "battle") {
      hasInitialScrolled.current = false
    }
  }, [phase])

  useEffect(() => {
    const updateHeight = () => {
      const container = containerRef.current
      if (container) {
        const rect = container.getBoundingClientRect()
        setCanvasHeight(Math.floor(rect.height))
      }
    }

    updateHeight()
    window.addEventListener("resize", updateHeight)

    const timeoutId = setTimeout(updateHeight, 100)

    return () => {
      window.removeEventListener("resize", updateHeight)
      clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    if (scrollContainerRef.current && currentTank) {
      const scrollContainer = scrollContainerRef.current
      const containerWidth = scrollContainer.clientWidth
      const tankCanvasX = currentTank.x + SCROLL_PADDING
      const targetScroll = tankCanvasX - containerWidth / 2

      scrollContainer.scrollTo({
        left: Math.max(0, Math.min(targetScroll, TOTAL_WIDTH - containerWidth)),
        behavior: "smooth",
      })
    }
  }, [turnId])

  useEffect(() => {
    if (scrollContainerRef.current && projectile?.active) {
      const scrollContainer = scrollContainerRef.current
      const containerWidth = scrollContainer.clientWidth
      const projectileCanvasX = projectile.x + SCROLL_PADDING
      const targetScroll = projectileCanvasX - containerWidth / 2

      scrollContainer.scrollTo({
        left: Math.max(0, Math.min(targetScroll, TOTAL_WIDTH - containerWidth)),
        behavior: "auto",
      })
    }
  }, [projectile?.x, projectile?.active])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const bandHeight = Math.ceil(canvasHeight / skyGradient.length)
    skyGradient.forEach((color, index) => {
      ctx.fillStyle = color
      ctx.fillRect(0, index * bandHeight, TOTAL_WIDTH, bandHeight + 1)
    })

    ctx.fillStyle = "oklch(0.25 0.05 264)"
    ctx.beginPath()
    ctx.moveTo(0, canvasHeight)
    ctx.lineTo(0, terrain[0] || canvasHeight * 0.75)
    terrain.forEach((y, x) => {
      ctx.lineTo(x, y) // x is already the canvas position, no offset needed
    })
    ctx.lineTo(TOTAL_WIDTH, terrain[terrain.length - 1] || canvasHeight * 0.75)
    ctx.lineTo(TOTAL_WIDTH, canvasHeight)
    ctx.closePath()
    ctx.fill()

    if (tracerTrail.length > 1) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(tracerTrail[0].x + SCROLL_PADDING, tracerTrail[0].y)
      tracerTrail.forEach((point) => {
        ctx.lineTo(point.x + SCROLL_PADDING, point.y)
      })
      ctx.stroke()
      ctx.setLineDash([])

      const lastPoint = tracerTrail[tracerTrail.length - 1]
      ctx.fillStyle = "#ffffff"
      ctx.beginPath()
      ctx.arc(lastPoint.x + SCROLL_PADDING, lastPoint.y, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 2
      ctx.stroke()
    }

    napalmParticles.forEach((p) => {
      const alpha = p.life / p.maxLife
      ctx.fillStyle = `rgba(255, ${100 + Math.random() * 50}, 0, ${alpha})`
      const terrainIndex = Math.floor(p.x + SCROLL_PADDING)
      const terrainY = terrain[terrainIndex] || canvasHeight * 0.75
      ctx.fillRect(p.x + SCROLL_PADDING - 2, terrainY - 4 - Math.random() * 8, 4, 8)
    })

    tanks.forEach((tank, index) => {
      if (tank.health <= 0) return

      const tankX = tank.x + SCROLL_PADDING
      ctx.fillStyle = tank.color

      ctx.fillRect(tankX - 12, tank.y - 4, 24, 8)
      ctx.fillRect(tankX - 8, tank.y - 8, 16, 4)

      // Using (180 - angle) so slider left = shoot left, slider right = shoot right
      const visualAngle = 180 - tank.angle
      const angleRad = (visualAngle * Math.PI) / 180
      const barrelLength = 18
      const direction = index === 0 ? 1 : -1
      ctx.beginPath()
      ctx.moveTo(tankX, tank.y - 6)
      ctx.lineTo(tankX + Math.cos(angleRad) * barrelLength * direction, tank.y - 6 - Math.sin(angleRad) * barrelLength)
      ctx.strokeStyle = tank.color
      ctx.lineWidth = 4
      ctx.stroke()

      const healthWidth = 30
      const healthHeight = 4
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)"
      ctx.fillRect(tankX - healthWidth / 2, tank.y - 20, healthWidth, healthHeight)
      ctx.fillStyle = tank.health > 30 ? "#40c040" : "#c04040"
      ctx.fillRect(tankX - healthWidth / 2, tank.y - 20, healthWidth * (tank.health / tank.maxHealth), healthHeight)

      if (index === currentTankIndex && phase === "battle") {
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.moveTo(tankX, tank.y - 30)
        ctx.lineTo(tankX - 5, tank.y - 38)
        ctx.lineTo(tankX + 5, tank.y - 38)
        ctx.closePath()
        ctx.fill()
      }
    })

    if (projectile && projectile.active) {
      const projX = projectile.x + SCROLL_PADDING
      ctx.fillStyle = "#ffffff"
      ctx.beginPath()
      ctx.arc(projX, projectile.y, 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)"
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(projX - projectile.vx * 3, projectile.y - projectile.vy * 3)
      ctx.lineTo(projX, projectile.y)
      ctx.stroke()
      ctx.setLineDash([])
    }

    subProjectiles.forEach((p) => {
      if (!p.active) return
      ctx.fillStyle = "#ffcc00"
      ctx.beginPath()
      ctx.arc(p.x + SCROLL_PADDING, p.y, 3, 0, Math.PI * 2)
      ctx.fill()
    })

    explosions.forEach((explosion) => {
      const progress = explosion.frame / explosion.maxFrames
      const currentRadius = explosion.radius * (0.5 + progress * 0.5)
      const alpha = 1 - progress
      const expX = explosion.x + SCROLL_PADDING

      ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`
      ctx.beginPath()
      ctx.arc(expX, explosion.y, currentRadius, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = `rgba(255, 100, 50, ${alpha})`
      ctx.lineWidth = 2
      ctx.stroke()
    })
  }, [
    terrain,
    tanks,
    projectile,
    subProjectiles,
    explosions,
    napalmParticles,
    tracerTrail,
    currentTankIndex,
    phase,
    skyGradient,
    canvasHeight,
  ])

  useEffect(() => {
    if (phase !== "battle") return

    if (projectile?.active) {
      hasScheduledNextTurn.current = false
    }

    const animate = () => {
      let stillAnimating = false

      if (projectile?.active) {
        stillAnimating = updateProjectile() || stillAnimating
      }

      if (subProjectiles.length > 0) {
        stillAnimating = updateSubProjectiles() || stillAnimating
      }

      if (napalmParticles.length > 0) {
        updateNapalm()
        stillAnimating = true
      }

      if (explosions.length > 0) {
        updateExplosions()
        stillAnimating = true
      }

      draw()

      if (stillAnimating) {
        animationRef.current = requestAnimationFrame(animate)
      } else if (
        !projectile?.active &&
        subProjectiles.length === 0 &&
        napalmParticles.length === 0 &&
        explosions.length === 0 &&
        projectile !== null &&
        !hasScheduledNextTurn.current
      ) {
        hasScheduledNextTurn.current = true
        setTimeout(() => {
          setProcessingShot(false)
          const gameEnded = checkGameOver()
          if (!gameEnded) {
            nextTurn()
          }
        }, 500)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [
    phase,
    projectile,
    subProjectiles,
    explosions,
    napalmParticles,
    draw,
    updateProjectile,
    updateSubProjectiles,
    updateExplosions,
    updateNapalm,
    nextTurn,
    checkGameOver,
    setProcessingShot,
  ])

  useEffect(() => {
    draw()
  }, [draw])

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <div
        ref={scrollContainerRef}
        className="w-full h-full overflow-x-auto overflow-y-hidden scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <canvas
          ref={canvasRef}
          width={TOTAL_WIDTH}
          height={canvasHeight}
          style={{ width: TOTAL_WIDTH, height: "100%" }}
        />
      </div>
      {phase === "battle" && <WindHUD wind={wind} />}
    </div>
  )
}
