"use client"

import { create } from "zustand"
import {
  type GameState,
  type Tank,
  WEAPONS,
  type Projectile,
  type NapalmParticle,
  type MaterialNode,
  type Extractor,
  type MaterialProjectile,
  type MaterialType,
} from "@/lib/game-types"
// Define constants locally (matching skirmish-store values to avoid import issues)
const CANVAS_WIDTH = 1600
const CANVAS_HEIGHT = 500
const SCROLL_PADDING = 200
const TOTAL_WIDTH = CANVAS_WIDTH + SCROLL_PADDING * 2

// Re-export constants for consistency
export { CANVAS_WIDTH, CANVAS_HEIGHT, SCROLL_PADDING, TOTAL_WIDTH }

const EXTRACTOR_DEPLOY_TIME = 2000 // 2 seconds deployment animation
const EXTRACTION_INTERVAL = 30000 // 30 seconds
const EXTRACTION_AMOUNT = 5 // 5 units per extraction
const EXTRACTOR_MAX_HEALTH = 25
const EXTRACTOR_PROXIMITY_RADIUS = 50 // How close extractor needs to be to node center

function generateTerrain(): number[] {
  const terrain: number[] = []

  for (let x = 0; x < TOTAL_WIDTH; x++) {
    let height = CANVAS_HEIGHT * 0.7

    const centeredX = x - SCROLL_PADDING

    // Add large rolling hills (low frequency)
    height += Math.sin(centeredX * 0.008) * 80
    height += Math.sin(centeredX * 0.015 + 2) * 50

    // Add medium mountains (medium frequency)
    height += Math.sin(centeredX * 0.03 + 1) * 40
    height += Math.sin(centeredX * 0.05 + 3) * 25

    // Add small peaks and detail (high frequency)
    height += Math.sin(centeredX * 0.1 + 0.5) * 15
    height += (Math.random() - 0.5) * 10

    // Clamp to valid range
    height = Math.max(CANVAS_HEIGHT * 0.4, Math.min(CANVAS_HEIGHT * 0.95, height))
    terrain.push(height)
  }

  // Smooth the terrain
  for (let pass = 0; pass < 2; pass++) {
    for (let x = 1; x < terrain.length - 1; x++) {
      terrain[x] = (terrain[x - 1] + terrain[x] + terrain[x + 1]) / 3
    }
  }

  return terrain
}

function generateMaterialNodes(terrain: number[]): MaterialNode[] {
  const nodes: MaterialNode[] = []
  const types: MaterialType[] = ["iron", "copper", "oil"]
  const nodeCounts: Record<MaterialType, number> = {
    iron: 2 + Math.floor(Math.random() * 3), // 2-4 nodes
    copper: 2 + Math.floor(Math.random() * 3),
    oil: 2 + Math.floor(Math.random() * 3),
  }

  // Grid constants (matching grid-system.tsx)
  const GRID_COLS = 8
  const TOTAL_SEGMENTS = 64
  const SEGMENT_WIDTH = CANVAS_WIDTH / TOTAL_SEGMENTS // 25 pixels per segment

  // Find top portion of terrain (top 30% of height range)
  const minHeight = Math.min(...terrain)
  const maxHeight = Math.max(...terrain)
  const topThreshold = minHeight + (maxHeight - minHeight) * 0.3

  // Track used segments to avoid overlap
  const usedSegments = new Set<number>()

  types.forEach((type) => {
    for (let i = 0; i < nodeCounts[type]; i++) {
      let attempts = 0
      let placed = false

      while (!placed && attempts < 50) {
        // Choose a random segment to start at (leave room for width)
        const segmentWidth = 3 + Math.floor(Math.random() * 3) // 3-5 segments wide
        const maxStartSegment = TOTAL_SEGMENTS - segmentWidth
        const segmentStart = Math.floor(Math.random() * maxStartSegment)

        // Check if any of these segments are already used
        let segmentOverlap = false
        for (let s = segmentStart; s < segmentStart + segmentWidth; s++) {
          if (usedSegments.has(s)) {
            segmentOverlap = true
            break
          }
        }

        if (!segmentOverlap) {
          // Calculate center X position
          const centerSegment = segmentStart + segmentWidth / 2
          const x = centerSegment * SEGMENT_WIDTH
          const terrainIndex = Math.floor(x + SCROLL_PADDING)
          const terrainY = terrain[terrainIndex] ?? CANVAS_HEIGHT * 0.7

          // Place on top portion of terrain
          if (terrainY <= topThreshold) {
            const nodeId = `${type}-${i}-${Date.now()}`

            // Mark segments as used
            for (let s = segmentStart; s < segmentStart + segmentWidth; s++) {
              usedSegments.add(s)
            }

            nodes.push({
              id: nodeId,
              x,
              y: terrainY,
              type,
              segmentStart,
              segmentWidth,
              shimmerPhase: Math.random() * Math.PI * 2,
            })
            placed = true
          }
        }
        attempts++
      }
    }
  })

  return nodes
}

function gameXToTerrainIndex(gameX: number): number {
  return Math.floor(gameX + SCROLL_PADDING)
}

function getSafeTankY(terrainY: number, canvasHeight: number): number {
  return terrainY - 8
}

function createTank(id: string, name: string, x: number, terrain: number[], color: string, isAI: boolean): Tank {
  const terrainIndex = gameXToTerrainIndex(x)
  const terrainY = terrain[terrainIndex] ?? CANVAS_HEIGHT * 0.7

  // Ensure extractors are at the top of weapon list
  const extractors = WEAPONS.filter((w) => w.id.includes("extractor"))
  const otherWeapons = WEAPONS.filter((w) => !w.id.includes("extractor"))
  const orderedWeapons = [...extractors, ...otherWeapons]

  return {
    id,
    name,
    x,
    y: getSafeTankY(terrainY, CANVAS_HEIGHT),
    angle: 90,
    power: 50,
    health: 50,
    maxHealth: 50,
    money: 1000,
    color,
    weapons: orderedWeapons.map((w) => ({ ...w })),
    shields: 0,
    parachutes: 0,
    currentWeapon: 0,
    isAI,
  }
}

interface FullGameStore extends GameState {
  // Material system
  materialNodes: MaterialNode[]
  extractors: Extractor[]
  materialProjectiles: MaterialProjectile[]
  inventory: { iron: number; copper: number; oil: number }

  // Core game methods
  initGame: () => void
  setPhase: (phase: GameState["phase"]) => void
  updateTank: (tankId: string, updates: Partial<Tank>) => void
  fireProjectile: () => void
  updateProjectile: () => boolean
  addExplosion: (x: number, y: number, radius: number) => void
  updateExplosions: () => void
  applyDamage: (x: number, y: number, radius: number, damage: number) => void
  deformTerrain: (x: number, radius: number) => void
  digTerrain: (x: number, depth: number, width: number) => void
  endBuyingPhase: () => void
  isProcessingShot: boolean
  setProcessingShot: (value: boolean) => void
  addTracerPoint: (x: number, y: number) => void
  clearTracerTrail: () => void
  addNapalmParticles: (x: number, y: number, count: number) => void
  updateNapalm: () => void
  addSubProjectiles: (projectiles: Projectile[]) => void
  updateSubProjectiles: () => boolean

  // Extractor system
  addExtractor: (x: number, y: number, type: MaterialType) => void
  updateExtractors: () => void
  updateMaterialProjectiles: () => void
  updateMaterialNodes: () => void

  // Full Game specific
  level: number
  campaignProgress: number
}

export const useFullGameStore = create<FullGameStore>((set, get) => ({
  phase: "menu",
  tanks: [],
  currentTankIndex: 0,
  terrain: [],
  wind: 0,
  projectile: null,
  subProjectiles: [],
  explosions: [],
  napalmParticles: [],
  tracerTrail: [],
  round: 1,
  maxRounds: 5,
  winner: null,
  isProcessingShot: false,
  turnId: 0,
  level: 1,
  campaignProgress: 0,

  // Material system
  materialNodes: [],
  extractors: [],
  materialProjectiles: [],
  inventory: { iron: 0, copper: 0, oil: 0 },

  initGame: () => {
    const terrain = generateTerrain()
    const materialNodes = generateMaterialNodes(terrain)

    // Spawn player in center, no enemy
    const playerX = CANVAS_WIDTH / 2
    const tank1 = createTank("player", "You", playerX, terrain, "oklch(0.45 0.15 150)", false)

    set({
      phase: "battle", // Skip buying phase
      tanks: [tank1],
      currentTankIndex: 0,
      terrain,
      wind: (Math.random() - 0.5) * 2,
      projectile: null,
      subProjectiles: [],
      explosions: [],
      napalmParticles: [],
      tracerTrail: [],
      round: 1,
      winner: null,
      isProcessingShot: false,
      turnId: 0,
      materialNodes,
      extractors: [],
      materialProjectiles: [],
      inventory: { iron: 0, copper: 0, oil: 0 },
    })
  },

  setPhase: (phase) => set({ phase }),

  updateTank: (tankId, updates) =>
    set((state) => ({
      tanks: state.tanks.map((t) => (t.id === tankId ? { ...t, ...updates } : t)),
    })),

  fireProjectile: () => {
    const state = get()
    if (state.isProcessingShot) return

    const tank = state.tanks[state.currentTankIndex]
    const weapon = tank.weapons[tank.currentWeapon]

    if (weapon.quantity <= 0 && weapon.price > 0) return

    // Check if this is an extractor
    if (weapon.id.includes("extractor")) {
      const extractorType = weapon.id.split("-")[0] as MaterialType

      const visualAngle = 180 - tank.angle
      const angleRad = (visualAngle * Math.PI) / 180
      const speed = tank.power * 0.15

      const projectile: Projectile = {
        x: tank.x,
        y: tank.y - 5,
        vx: Math.cos(angleRad) * speed,
        vy: -Math.sin(angleRad) * speed,
        weapon,
        tankId: tank.id,
        active: true,
      }

      set({ projectile, phase: "battle", isProcessingShot: true, tracerTrail: [] })
      return
    }

    // Regular weapon logic (baby missile, etc.)
    const visualAngle = 180 - tank.angle
    const angleRad = (visualAngle * Math.PI) / 180
    const speed = tank.power * 0.15

    const projectile: Projectile = {
      x: tank.x,
      y: tank.y - 5,
      vx: Math.cos(angleRad) * speed,
      vy: -Math.sin(angleRad) * speed,
      weapon,
      tankId: tank.id,
      active: true,
    }

    if (weapon.price > 0) {
      const newWeapons = [...tank.weapons]
      newWeapons[tank.currentWeapon] = { ...weapon, quantity: weapon.quantity - 1 }
      get().updateTank(tank.id, { weapons: newWeapons })
    }

    set({ projectile, phase: "battle", isProcessingShot: true, tracerTrail: [] })
  },

  updateProjectile: () => {
    const state = get()
    if (!state.projectile || !state.projectile.active) return false

    const p = state.projectile
    const gravity = 0.15
    const windEffect = state.wind * 0.02

    const newX = p.x + p.vx
    const newY = p.y + p.vy
    const newVx = p.vx + windEffect
    const newVy = p.vy + gravity

    const terrainIndex = Math.floor(newX) + SCROLL_PADDING
    const terrainY = state.terrain[terrainIndex] ?? CANVAS_HEIGHT

    const leftBound = -SCROLL_PADDING
    const rightBound = CANVAS_WIDTH + SCROLL_PADDING

    if (newY >= terrainY || newX < leftBound || newX >= rightBound || newY > CANVAS_HEIGHT) {
      const hitX = Math.max(leftBound, Math.min(rightBound - 1, newX))
      const hitY = Math.min(newY, terrainY)

      // Check if this is an extractor
      if (p.weapon.id.includes("extractor")) {
        const extractorType = p.weapon.id.split("-")[0] as MaterialType
        get().addExtractor(hitX, hitY, extractorType)
        set({ projectile: { ...p, active: false }, isProcessingShot: false })
        return false
      }

      // Regular weapon explosion
      get().addExplosion(hitX, hitY, p.weapon.radius)
      get().deformTerrain(hitX, p.weapon.radius)
      get().applyDamage(hitX, hitY, p.weapon.radius, p.weapon.damage)

      set({ projectile: { ...p, active: false }, isProcessingShot: false })
      return false
    }

    set({
      projectile: {
        ...p,
        x: newX,
        y: newY,
        vx: newVx,
        vy: newVy,
      },
    })
    return true
  },

  addExtractor: (x, y, type) => {
    const state = get()

    // Find nearest material node of matching type
    let nearestNode: MaterialNode | null = null
    let minDistance = EXTRACTOR_PROXIMITY_RADIUS

    state.materialNodes.forEach((node) => {
      if (node.type === type) {
        const dist = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2)
        if (dist < minDistance) {
          minDistance = dist
          nearestNode = node
        }
      }
    })

    const extractorId = `extractor-${Date.now()}-${Math.random()}`
    const extractor: Extractor = {
      id: extractorId,
      x,
      y,
      type,
      health: EXTRACTOR_MAX_HEALTH,
      maxHealth: EXTRACTOR_MAX_HEALTH,
      deployProgress: 0,
      lastExtractionTime: Date.now() + EXTRACTOR_DEPLOY_TIME, // Start extracting after deployment
      extractionRate: EXTRACTION_AMOUNT,
      nodeId: nearestNode?.id || null,
    }

    set({
      extractors: [...state.extractors, extractor],
    })
  },

  updateExtractors: () => {
    const state = get()
    const now = Date.now()
    const playerTank = state.tanks.find((t) => t.id === "player")
    if (!playerTank) return

    const updatedExtractors = state.extractors.map((extractor) => {
      // Update deployment progress
      if (extractor.deployProgress < 1) {
        const deployTime = now - (extractor.lastExtractionTime - EXTRACTOR_DEPLOY_TIME)
        extractor.deployProgress = Math.min(1, deployTime / EXTRACTOR_DEPLOY_TIME)
      }

      // Check if extractor is deployed and has a valid node
      if (extractor.deployProgress >= 1 && extractor.nodeId) {
        const node = state.materialNodes.find((n) => n.id === extractor.nodeId)
        if (node && extractor.health > 0) {
          // Check if it's time to extract
          if (now - extractor.lastExtractionTime >= EXTRACTION_INTERVAL) {
            // Create material projectile heading to base
            const dx = playerTank.x - extractor.x
            const dy = playerTank.y - extractor.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            const speed = 3

            const materialProj: MaterialProjectile = {
              x: extractor.x,
              y: extractor.y - 5,
              vx: (dx / distance) * speed,
              vy: (dy / distance) * speed,
              type: extractor.type,
              amount: extractor.extractionRate,
              targetX: playerTank.x,
              targetY: playerTank.y,
              active: true,
              trail: [],
            }

            set((s) => ({
              materialProjectiles: [...s.materialProjectiles, materialProj],
            }))

            extractor.lastExtractionTime = now
          }
        }
      }

      return extractor
    })

    set({ extractors: updatedExtractors })
  },

  updateMaterialProjectiles: () => {
    const state = get()
    const playerTank = state.tanks.find((t) => t.id === "player")
    if (!playerTank) {
      set({ materialProjectiles: [] })
      return
    }

    const gravity = 0.1
    const stillActive: MaterialProjectile[] = []

    state.materialProjectiles.forEach((proj) => {
      if (!proj.active) return

      // Update target position in case tank moved
      const currentTargetX = playerTank.x
      const currentTargetY = playerTank.y

      // Recalculate velocity to always aim at base (homing behavior)
      const dx = currentTargetX - proj.x
      const dy = currentTargetY - proj.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const speed = 3

      // Only recalculate if not too close (to avoid jitter)
      let vx = proj.vx
      let vy = proj.vy
      if (distance > 30) {
        vx = (dx / distance) * speed
        vy = (dy / distance) * speed
      }

      const newX = proj.x + vx
      const newY = proj.y + vy

      // Add to trail
      proj.trail.push({ x: proj.x, y: proj.y })
      if (proj.trail.length > 20) proj.trail.shift()

      // Check if reached base (use updated position)
      const distToBase = Math.sqrt((newX - currentTargetX) ** 2 + (newY - currentTargetY) ** 2)
      if (distToBase < 30) {
        // Add to inventory
        set((s) => ({
          inventory: {
            ...s.inventory,
            [proj.type]: s.inventory[proj.type] + proj.amount,
          },
        }))
        return // Don't add to stillActive
      }

      // Check bounds
      const leftBound = -SCROLL_PADDING
      const rightBound = CANVAS_WIDTH + SCROLL_PADDING

      if (newX < leftBound || newX >= rightBound || newY > CANVAS_HEIGHT || newY < 0) {
        return // Out of bounds, don't add to stillActive
      }

      stillActive.push({
        ...proj,
        x: newX,
        y: newY,
        vx,
        vy,
        targetX: currentTargetX,
        targetY: currentTargetY,
      })
    })

    set({ materialProjectiles: stillActive })
  },

  updateMaterialNodes: () => {
    const state = get()
    const now = Date.now()

    // Update shimmer phase for animation
    const updatedNodes = state.materialNodes.map((node) => ({
      ...node,
      shimmerPhase: node.shimmerPhase + 0.05,
    }))

    set({ materialNodes: updatedNodes })
  },

  addExplosion: (x, y, radius) =>
    set((state) => ({
      explosions: [...state.explosions, { x, y, radius, frame: 0, maxFrames: 15 }],
    })),

  updateExplosions: () =>
    set((state) => ({
      explosions: state.explosions.map((e) => ({ ...e, frame: e.frame + 1 })).filter((e) => e.frame < e.maxFrames),
    })),

  applyDamage: (x, y, radius, damage) =>
    set((state) => {
      // Damage tanks
      const newTanks = state.tanks.map((tank) => {
        const dist = Math.sqrt((tank.x - x) ** 2 + (tank.y - y) ** 2)
        if (dist < radius) {
          const damageMultiplier = 1 - dist / radius
          const actualDamage = Math.floor(damage * damageMultiplier)
          const newHealth = Math.max(0, tank.health - actualDamage)
          return { ...tank, health: newHealth }
        }
        return tank
      })

      // Damage extractors
      const newExtractors = state.extractors.map((extractor) => {
        const dist = Math.sqrt((extractor.x - x) ** 2 + (extractor.y - y) ** 2)
        if (dist < radius) {
          const damageMultiplier = 1 - dist / radius
          const actualDamage = Math.floor(damage * damageMultiplier)
          const newHealth = Math.max(0, extractor.health - actualDamage)
          return { ...extractor, health: newHealth }
        }
        return extractor
      })

      return { tanks: newTanks, extractors: newExtractors }
    }),

  deformTerrain: (x, radius) =>
    set((state) => {
      const newTerrain = [...state.terrain]
      const startIdx = Math.max(0, Math.floor(x + SCROLL_PADDING - radius))
      const endIdx = Math.min(TOTAL_WIDTH, Math.floor(x + SCROLL_PADDING + radius))

      for (let i = startIdx; i < endIdx; i++) {
        const dist = Math.abs(i - (x + SCROLL_PADDING))
        const depth = Math.sqrt(radius * radius - dist * dist)
        newTerrain[i] = Math.min(CANVAS_HEIGHT, newTerrain[i] + depth * 1.5)
      }

      const newTanks = state.tanks.map((tank) => {
        const terrainY = newTerrain[Math.floor(tank.x) + SCROLL_PADDING]
        const newY = getSafeTankY(terrainY, CANVAS_HEIGHT)
        return { ...tank, y: newY }
      })

      const newExtractors = state.extractors.map((extractor) => {
        const terrainY = newTerrain[Math.floor(extractor.x) + SCROLL_PADDING]
        const newY = getSafeTankY(terrainY, CANVAS_HEIGHT)
        return { ...extractor, y: newY }
      })

      return { terrain: newTerrain, tanks: newTanks, extractors: newExtractors }
    }),

  digTerrain: (x, depth, width) =>
    set((state) => {
      const newTerrain = [...state.terrain]
      const halfWidth = width / 2
      const startIdx = Math.max(0, Math.floor(x + SCROLL_PADDING - halfWidth))
      const endIdx = Math.min(TOTAL_WIDTH, Math.floor(x + SCROLL_PADDING + halfWidth))

      for (let i = startIdx; i < endIdx; i++) {
        newTerrain[i] = Math.min(CANVAS_HEIGHT, newTerrain[i] + depth)
      }

      const newTanks = state.tanks.map((tank) => {
        const terrainY = newTerrain[Math.floor(tank.x) + SCROLL_PADDING]
        const newY = getSafeTankY(terrainY, CANVAS_HEIGHT)
        return { ...tank, y: newY }
      })

      const newExtractors = state.extractors.map((extractor) => {
        const terrainY = newTerrain[Math.floor(extractor.x) + SCROLL_PADDING]
        const newY = getSafeTankY(terrainY, CANVAS_HEIGHT)
        return { ...extractor, y: newY }
      })

      return { terrain: newTerrain, tanks: newTanks, extractors: newExtractors }
    }),

  endBuyingPhase: () => set({ phase: "battle" }),

  checkGameOver: () => {
    // Full Game doesn't have traditional game over
    return false
  },

  setProcessingShot: (value) => set({ isProcessingShot: value }),

  addTracerPoint: (x, y) =>
    set((state) => ({
      tracerTrail: [...state.tracerTrail, { x, y }],
    })),

  clearTracerTrail: () => set({ tracerTrail: [] }),

  addNapalmParticles: (x, y, count) =>
    set((state) => {
      const particles: NapalmParticle[] = []
      for (let i = 0; i < count; i++) {
        particles.push({
          x: x + (Math.random() - 0.5) * 30,
          y: y,
          life: count + Math.random() * 20,
          maxLife: count + 20,
        })
      }
      return { napalmParticles: [...state.napalmParticles, ...particles] }
    }),

  updateNapalm: () =>
    set((state) => {
      const newParticles = state.napalmParticles
        .map((p) => {
          const leftY = state.terrain[Math.floor(p.x - 1) + SCROLL_PADDING] || CANVAS_HEIGHT
          const rightY = state.terrain[Math.floor(p.x + 1) + SCROLL_PADDING] || CANVAS_HEIGHT
          const currentY = state.terrain[Math.floor(p.x) + SCROLL_PADDING] || CANVAS_HEIGHT

          let newX = p.x
          if (leftY > currentY) newX -= 0.5
          else if (rightY > currentY) newX += 0.5

          return {
            ...p,
            x: Math.max(-SCROLL_PADDING, Math.min(CANVAS_WIDTH + SCROLL_PADDING - 1, newX)),
            life: p.life - 1,
          }
        })
        .filter((p) => p.life > 0)

      return { napalmParticles: newParticles }
    }),

  addSubProjectiles: (projectiles) =>
    set((state) => ({
      subProjectiles: [...state.subProjectiles, ...projectiles],
    })),

  updateSubProjectiles: () => {
    const state = get()
    if (state.subProjectiles.length === 0) return false

    const gravity = 0.15
    const stillActive: Projectile[] = []

    const leftBound = -SCROLL_PADDING
    const rightBound = CANVAS_WIDTH + SCROLL_PADDING

    state.subProjectiles.forEach((p) => {
      if (!p.active) return

      const newX = p.x + p.vx
      const newY = p.y + p.vy
      const terrainY = state.terrain[Math.floor(newX) + SCROLL_PADDING] || CANVAS_HEIGHT

      if (newY >= terrainY || newX < leftBound || newX >= rightBound) {
        get().addExplosion(newX, Math.min(newY, terrainY), p.weapon.radius)
        get().deformTerrain(newX, p.weapon.radius)
        get().applyDamage(newX, Math.min(newY, terrainY), p.weapon.radius, p.weapon.damage)
      } else {
        stillActive.push({
          ...p,
          x: newX,
          y: newY,
          vy: p.vy + gravity,
        })
      }
    })

    set({ subProjectiles: stillActive })
    return stillActive.length > 0
  },
}))
