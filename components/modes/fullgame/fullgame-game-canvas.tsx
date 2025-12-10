"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import {
  useFullGameStore,
  SCROLL_PADDING,
  TOTAL_WIDTH,
} from "@/lib/game-modes/fullgame/fullgame-store"

import { getRandomGradientColors, generateGradientBands } from "@/lib/gradient-utils"
import { FullGameWindHUD } from "./fullgame-wind-hud"
import { GridLabels } from "./grid-system"
import type { MaterialType } from "@/lib/game-types"

// Define constants locally to avoid import issues
const CANVAS_WIDTH = 1600
const CANVAS_HEIGHT = 500

function getMaterialColor(type: MaterialType): string {
  switch (type) {
    case "iron":
      return "oklch(0.65 0.15 220)" // Light blue
    case "copper":
      return "oklch(0.70 0.20 60)" // Mustard yellow-orange
    case "oil":
      return "oklch(0.70 0.25 350)" // Bright pink
    default:
      return "#ffffff"
  }
}

function getRainbowColor(phase: number): string {
  const hue = (phase * 180) % 360
  return `oklch(0.60 0.20 ${hue})`
}

export function FullGameGameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // Expose scroll container for grid sync
  useEffect(() => {
    if (scrollContainerRef.current) {
      ;(scrollContainerRef.current as any).dataset.gridSync = "true"
    }
  }, [])
  const animationRef = useRef<number>(0)
  const hasScheduledNextTurn = useRef(false)
  const hasInitialScrolled = useRef(false)
  const [canvasHeight, setCanvasHeight] = useState(600)

  const [skyGradient] = useState(() => {
    const colors = getRandomGradientColors()
    return generateGradientBands(colors, 11)
  })

  const {
    terrain,
    tanks,
    projectile,
    explosions,
    phase,
    updateProjectile,
    updateExplosions,
    setProcessingShot,
    materialNodes,
    extractors,
    materialProjectiles,
    updateExtractors,
    updateMaterialProjectiles,
    updateMaterialNodes,
    wind,
    napalmParticles,
    updateNapalm,
  } = useFullGameStore()

  const currentTank = tanks[0] // Player tank

  useEffect(() => {
    if (phase === "battle" && scrollContainerRef.current && currentTank && !hasInitialScrolled.current) {
      const timeoutId = setTimeout(() => {
        const scrollContainer = scrollContainerRef.current
        if (!scrollContainer) return

        const containerWidth = scrollContainer.clientWidth
        const tankCanvasX = currentTank.x + SCROLL_PADDING
        const targetScroll = tankCanvasX - containerWidth / 2

        scrollContainer.scrollTo({
          left: Math.max(0, Math.min(targetScroll, TOTAL_WIDTH - containerWidth)),
          behavior: "auto",
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

    // Draw sky gradient
    const bandHeight = Math.ceil(canvasHeight / skyGradient.length)
    skyGradient.forEach((color, index) => {
      ctx.fillStyle = color
      ctx.fillRect(0, index * bandHeight, TOTAL_WIDTH, bandHeight + 1)
    })

    // Draw terrain
    ctx.fillStyle = "oklch(0.25 0.05 264)"
    ctx.beginPath()
    ctx.moveTo(0, canvasHeight)
    ctx.lineTo(0, terrain[0] || canvasHeight * 0.75)
    terrain.forEach((y, x) => {
      ctx.lineTo(x, y)
    })
    ctx.lineTo(TOTAL_WIDTH, terrain[terrain.length - 1] || canvasHeight * 0.75)
    ctx.lineTo(TOTAL_WIDTH, canvasHeight)
    ctx.closePath()
    ctx.fill()

    // Draw material nodes with stroke and radial gradient (refined look)
    const SEGMENT_WIDTH = CANVAS_WIDTH / 64 // Match grid system
    materialNodes.forEach((node) => {
      // Node is centered between grid lines, so center is at (segmentStart + 0.5) * SEGMENT_WIDTH
      const nodeCenterX = node.x + SCROLL_PADDING
      const nodeWidth = node.segmentWidth * SEGMENT_WIDTH // 0.5 * SEGMENT_WIDTH
      const nodeStartX = nodeCenterX - nodeWidth / 2
      
      // Find the terrain height at the center and edges of the node
      const centerTerrainIndex = Math.floor(nodeCenterX)
      const centerTerrainY = terrain[centerTerrainIndex] ?? CANVAS_HEIGHT * 0.75
      
      const baseColor = getMaterialColor(node.type)
      const pulsePhase = (node.shimmerPhase * 0.3) % (Math.PI * 2)
      const nodeHeight = 6
      
      // Create radial gradient centered on the node, following terrain
      const gradientRadius = Math.max(nodeWidth * 0.8, 40)
      const gradientCenterY = centerTerrainY - nodeHeight / 2
      const gradient = ctx.createRadialGradient(
        nodeCenterX,
        gradientCenterY,
        0,
        nodeCenterX,
        gradientCenterY,
        gradientRadius
      )
      
      if (node.type === "oil") {
        // Oil with bright pink gradient
        const pinkColor = "oklch(0.70 0.25 350)" // Bright pink
        const lighterPink = "oklch(0.75 0.30 350)" // Even brighter pink
        gradient.addColorStop(0, lighterPink)
        gradient.addColorStop(0.4, pinkColor)
        gradient.addColorStop(0.8, "rgba(255, 100, 200, 0.5)") // Pink with opacity
        gradient.addColorStop(1, "rgba(255, 100, 200, 0.1)") // Light pink with opacity
      } else {
        // Iron and copper with radial gradient - brighter in center, fades at edges
        const lighterColor = node.type === "iron" 
          ? "oklch(0.70 0.18 220)" 
          : "oklch(0.75 0.22 60)"
        gradient.addColorStop(0, lighterColor)
        gradient.addColorStop(0.4, baseColor)
        // Use rgba for opacity - approximate the base color
        if (node.type === "iron") {
          gradient.addColorStop(0.8, "rgba(100, 150, 200, 0.5)") // Light blue with opacity
          gradient.addColorStop(1, "rgba(100, 150, 200, 0.1)")
        } else {
          gradient.addColorStop(0.8, "rgba(220, 180, 100, 0.5)") // Mustard with opacity
          gradient.addColorStop(1, "rgba(220, 180, 100, 0.1)")
        }
      }
      
      // Draw the gradient fill on terrain surface
      ctx.fillStyle = gradient
      ctx.globalAlpha = 0.85
      ctx.fillRect(nodeStartX - gradientRadius * 0.3, centerTerrainY - nodeHeight, nodeWidth + gradientRadius * 0.6, nodeHeight)
      
      // Draw stroke outline matching the node width
      ctx.strokeStyle = baseColor
      ctx.lineWidth = 2
      ctx.globalAlpha = 1.0
      ctx.beginPath()
      ctx.rect(nodeStartX, centerTerrainY - nodeHeight, nodeWidth, nodeHeight)
      ctx.stroke()
      
      ctx.globalAlpha = 1.0
    })

    // Draw extractors
    extractors.forEach((extractor) => {
      if (extractor.health <= 0) return

      const extractorX = extractor.x + SCROLL_PADDING
      const extractorColor = getMaterialColor(extractor.type)

      // Deployment animation
      const scale = 0.5 + extractor.deployProgress * 0.5

      ctx.save()
      ctx.translate(extractorX, extractor.y)
      ctx.scale(scale, scale)

      // Draw extractor body (similar to tank but smaller)
      ctx.fillStyle = extractorColor
      ctx.fillRect(-8, -3, 16, 6)
      ctx.fillRect(-6, -5, 12, 2)

      // Draw health bar
      const healthWidth = 20
      const healthHeight = 3
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)"
      ctx.fillRect(-healthWidth / 2, -12, healthWidth, healthHeight)
      ctx.fillStyle = extractor.health > 15 ? "#40c040" : "#c04040"
      ctx.fillRect(
        -healthWidth / 2,
        -12,
        healthWidth * (extractor.health / extractor.maxHealth),
        healthHeight,
      )

      // Particle effect when extracting
      if (extractor.deployProgress >= 1 && extractor.nodeId) {
        ctx.fillStyle = extractorColor
        for (let i = 0; i < 3; i++) {
          const angle = (Date.now() / 100 + i * 2) % (Math.PI * 2)
          const dist = 10 + Math.sin(Date.now() / 200) * 3
          ctx.fillRect(Math.cos(angle) * dist - 1, Math.sin(angle) * dist - 1, 2, 2)
        }
      }

      ctx.restore()
    })

    // Draw material projectiles
    materialProjectiles.forEach((proj) => {
      if (!proj.active) return

      const projX = proj.x + SCROLL_PADDING
      const projColor = getMaterialColor(proj.type)

      // Draw trail
      if (proj.trail.length > 1) {
        ctx.strokeStyle = projColor
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(proj.trail[0].x + SCROLL_PADDING, proj.trail[0].y)
        proj.trail.forEach((point) => {
          ctx.lineTo(point.x + SCROLL_PADDING, point.y)
        })
        ctx.stroke()
      }

      // Draw projectile
      ctx.fillStyle = projColor
      ctx.beginPath()
      ctx.arc(projX, proj.y, 4, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw crash debris particles (from failed extractor landings) - render after material projectiles
    // Note: We use napalmParticles for crash debris, but render them with grey/brown colors
    napalmParticles.forEach((p) => {
      const alpha = p.life / p.maxLife
      // Use grey/brown colors for crash debris instead of orange fire
      const r = 80 + Math.random() * 40
      const g = 60 + Math.random() * 30
      const b = 40 + Math.random() * 20
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
      const terrainIndex = Math.floor(p.x + SCROLL_PADDING)
      const terrainY = terrain[terrainIndex] || CANVAS_HEIGHT * 0.75
      ctx.fillRect(p.x + SCROLL_PADDING - 2, terrainY - 4 - Math.random() * 8, 4, 8)
    })

    // Draw tanks
    tanks.forEach((tank) => {
      if (tank.health <= 0) return

      const tankX = tank.x + SCROLL_PADDING
      ctx.fillStyle = tank.color

      ctx.fillRect(tankX - 12, tank.y - 4, 24, 8)
      ctx.fillRect(tankX - 8, tank.y - 8, 16, 4)

      // Match firing system: slider angle to math angle conversion
      const mathAngle = 180 - tank.angle
      const angleRad = (mathAngle * Math.PI) / 180
      const barrelLength = 18
      ctx.beginPath()
      ctx.moveTo(tankX, tank.y - 6)
      ctx.lineTo(tankX + Math.cos(angleRad) * barrelLength, tank.y - 6 - Math.sin(angleRad) * barrelLength)
      ctx.strokeStyle = tank.color
      ctx.lineWidth = 4
      ctx.stroke()

      // Health bar
      const healthWidth = 30
      const healthHeight = 4
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)"
      ctx.fillRect(tankX - healthWidth / 2, tank.y - 20, healthWidth, healthHeight)
      ctx.fillStyle = tank.health > 30 ? "#40c040" : "#c04040"
      ctx.fillRect(tankX - healthWidth / 2, tank.y - 20, healthWidth * (tank.health / tank.maxHealth), healthHeight)
    })

    // Draw projectile
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

    // Draw explosions
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
    explosions,
    phase,
    skyGradient,
    canvasHeight,
    materialNodes,
    extractors,
    materialProjectiles,
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

      if (explosions.length > 0) {
        updateExplosions()
        stillAnimating = true
      }

      // Update material systems
    updateExtractors()
    updateMaterialProjectiles()
    updateMaterialNodes()
    updateNapalm()

      draw()

      if (stillAnimating || materialProjectiles.length > 0) {
        animationRef.current = requestAnimationFrame(animate)
      } else if (!projectile?.active && explosions.length === 0 && projectile !== null && !hasScheduledNextTurn.current) {
        hasScheduledNextTurn.current = true
        setTimeout(() => {
          setProcessingShot(false)
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
    explosions,
    materialProjectiles,
    draw,
    updateProjectile,
    updateExplosions,
    updateExtractors,
    updateMaterialProjectiles,
    updateMaterialNodes,
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
        <div className="relative" style={{ width: TOTAL_WIDTH, height: "100%" }}>
          <canvas
            ref={canvasRef}
            width={TOTAL_WIDTH}
            height={canvasHeight}
            style={{ width: TOTAL_WIDTH, height: "100%" }}
          />
          {phase === "battle" && <GridLabels />}
        </div>
      </div>
      {phase === "battle" && <FullGameWindHUD />}
    </div>
  )
}

