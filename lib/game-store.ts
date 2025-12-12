"use client"

import { create } from "zustand"
import { type GameState, type Tank, WEAPONS, type Projectile, type NapalmParticle } from "./game-types"

const CANVAS_WIDTH = 1600 // Doubled canvas width from 800 to 1600
const CANVAS_HEIGHT = 500
const SCROLL_PADDING = 200 // Extra space on each side
const TOTAL_WIDTH = CANVAS_WIDTH + SCROLL_PADDING * 2 // Total width now includes padding on both sides

export { CANVAS_WIDTH, CANVAS_HEIGHT, SCROLL_PADDING, TOTAL_WIDTH }

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

function gameXToTerrainIndex(gameX: number): number {
  return Math.floor(gameX + SCROLL_PADDING)
}

function getSafeTankY(terrainY: number, canvasHeight: number): number {
  // Tank sits 8px above the terrain surface, can go anywhere terrain goes
  return terrainY - 8
}

function checkTankBuried(tank: Tank, terrain: number[]): boolean {
  const terrainY = terrain[Math.floor(tank.x)]
  // If terrain is more than 20px above the tank, they're buried
  return terrainY < tank.y - 12
}

function createTank(id: string, name: string, x: number, terrain: number[], color: string, isAI: boolean): Tank {
  const terrainIndex = gameXToTerrainIndex(x)
  const terrainY = terrain[terrainIndex] ?? CANVAS_HEIGHT * 0.7

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
    mechColor: color, // Use the color parameter instead of hardcoded green
    weapons: WEAPONS.map((w) => ({ ...w })),
    shields: 0,
    parachutes: 0,
    currentWeapon: 0,
    isAI,
  }
}

interface GameStore extends GameState {
  initGame: () => void
  setPhase: (phase: GameState["phase"]) => void
  updateTank: (tankId: string, updates: Partial<Tank>) => void
  setMechColor: (tankId: string, color: string) => void // Added setMechColor function
  nextTurn: () => void
  fireProjectile: () => void
  updateProjectile: () => boolean
  addExplosion: (x: number, y: number, radius: number) => void
  updateExplosions: () => void
  applyDamage: (x: number, y: number, radius: number, damage: number) => void
  deformTerrain: (x: number, radius: number) => void
  digTerrain: (x: number, depth: number, width: number) => void
  buyWeapon: (tankId: string, weaponId: string) => void
  buyItem: (tankId: string, itemId: string) => void
  endBuyingPhase: () => void
  checkGameOver: () => boolean
  isProcessingShot: boolean
  setProcessingShot: (value: boolean) => void
  addTracerPoint: (x: number, y: number) => void
  clearTracerTrail: () => void
  addNapalmParticles: (x: number, y: number, count: number) => void
  updateNapalm: () => void
  addSubProjectiles: (projectiles: Projectile[]) => void
  updateSubProjectiles: () => boolean
  turnId: number
}

export const useGameStore = create<GameStore>((set, get) => ({
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

  initGame: () => {
    const terrain = generateTerrain()

    const enemyOnLeft = Math.random() < 0.5
    const playerX = CANVAS_WIDTH / 2
    const enemyX = enemyOnLeft ? 300 : CANVAS_WIDTH - 300

    const state = get()
    const existingPlayerTank = state.tanks.find((t) => t.id === "player")
    const playerColor = existingPlayerTank?.mechColor || "oklch(0.45 0.15 150)" // Default to green

    const availableColors = [
      "oklch(0.45 0.15 150)", // Green
      "oklch(0.55 0.20 250)", // Blue
      "oklch(0.55 0.22 25)", // Red
      "oklch(0.60 0.20 300)", // Purple
      "oklch(0.65 0.18 60)", // Orange
      "oklch(0.60 0.18 200)", // Cyan
    ]

    const enemyColor = availableColors.find((c) => c !== playerColor) || "oklch(0.55 0.22 25)"

    const tank1 = createTank("player", "You", playerX, terrain, playerColor, false)
    const tank2 = createTank("enemy", "Enemy", enemyX, terrain, enemyColor, true)

    set({
      phase: "buying",
      tanks: [tank1, tank2],
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
    })
  },

  setPhase: (phase) => set({ phase }),

  updateTank: (tankId, updates) =>
    set((state) => ({
      tanks: state.tanks.map((t) => (t.id === tankId ? { ...t, ...updates } : t)),
    })),

  setMechColor: (tankId, color) =>
    set((state) => ({
      tanks: state.tanks.map((t) => (t.id === tankId ? { ...t, mechColor: color } : t)),
    })),

  nextTurn: () =>
    set((state) => {
      const aliveTanks = state.tanks.filter((t) => t.health > 0)
      if (aliveTanks.length <= 1) {
        return { phase: "gameOver", winner: aliveTanks[0] || null }
      }

      let nextIndex = (state.currentTankIndex + 1) % state.tanks.length
      while (state.tanks[nextIndex].health <= 0) {
        nextIndex = (nextIndex + 1) % state.tanks.length
      }

      return {
        currentTankIndex: nextIndex,
        wind: state.wind + (Math.random() - 0.5) * 0.5,
        tracerTrail: [],
        turnId: state.turnId + 1,
      }
    }),

  fireProjectile: () => {
    const state = get()
    if (state.isProcessingShot) return

    const tank = state.tanks[state.currentTankIndex]
    const weapon = tank.weapons[tank.currentWeapon]

    if (weapon.quantity <= 0 && weapon.price > 0) return

    const visualAngle = 180 - tank.angle
    const angleRad = (visualAngle * Math.PI) / 180
    const speed = tank.power * 0.15

    const projectile: Projectile = {
      x: tank.x,
      y: tank.y - 5,
      vx: Math.cos(angleRad) * speed * (state.currentTankIndex === 0 ? 1 : -1),
      vy: -Math.sin(angleRad) * speed,
      weapon,
      tankId: tank.id,
      active: true,
      bouncesLeft: weapon.bounces || 0,
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

    if (p.weapon.behavior === "tracer") {
      get().addTracerPoint(newX, newY)
    }

    const terrainIndex = Math.floor(newX) + SCROLL_PADDING
    const terrainY = state.terrain[terrainIndex] ?? CANVAS_HEIGHT

    const leftBound = -SCROLL_PADDING
    const rightBound = CANVAS_WIDTH + SCROLL_PADDING

    if (newY >= terrainY || newX < leftBound || newX >= rightBound || newY > CANVAS_HEIGHT) {
      const hitX = Math.max(leftBound, Math.min(rightBound - 1, newX))
      const hitY = Math.min(newY, terrainY)

      switch (p.weapon.behavior) {
        case "bouncing":
          if ((p.bouncesLeft || 0) > 0) {
            set({
              projectile: {
                ...p,
                x: hitX,
                y: terrainY - 2,
                vx: newVx * 0.8,
                vy: -Math.abs(newVy) * 0.6,
                bouncesLeft: (p.bouncesLeft || 0) - 1,
              },
            })
            return true
          }
          get().addExplosion(hitX, hitY, p.weapon.radius)
          get().deformTerrain(hitX, p.weapon.radius)
          get().applyDamage(hitX, hitY, p.weapon.radius, p.weapon.damage)
          break

        case "splitting":
          const splitCount = p.weapon.splitCount || 5
          const subProjectiles: Projectile[] = []
          for (let i = 0; i < splitCount; i++) {
            const spreadAngle = ((i - splitCount / 2) * 30) / splitCount
            const spreadRad = (spreadAngle * Math.PI) / 180
            subProjectiles.push({
              x: hitX,
              y: hitY - 10,
              vx: Math.cos(spreadRad) * 3 + (Math.random() - 0.5) * 2,
              vy: -Math.abs(Math.random() * 3 + 2),
              weapon: { ...p.weapon, behavior: "standard", splitCount: 0 },
              tankId: p.tankId,
              active: true,
              isSubProjectile: true,
            })
          }
          get().addSubProjectiles(subProjectiles)
          break

        case "rolling":
          const rollSpeed = p.weapon.rollSpeed || 2
          const rollDir = p.vx > 0 ? 1 : -1
          set({
            projectile: {
              ...p,
              x: hitX,
              y: terrainY - 3,
              vx: rollDir * rollSpeed,
              vy: 0,
              weapon: { ...p.weapon, behavior: "standard" },
            },
          })
          const leftTerrain = state.terrain[Math.floor(hitX - 5) + SCROLL_PADDING] || CANVAS_HEIGHT
          const rightTerrain = state.terrain[Math.floor(hitX + 5) + SCROLL_PADDING] || CANVAS_HEIGHT
          if (terrainY <= leftTerrain && terrainY <= rightTerrain) {
            get().addExplosion(hitX, hitY, p.weapon.radius)
            get().deformTerrain(hitX, p.weapon.radius)
            get().applyDamage(hitX, hitY, p.weapon.radius, p.weapon.damage)
            set({ projectile: { ...p, active: false }, isProcessingShot: false })
            return false
          }
          return true

        case "tracer":
          get().addTracerPoint(hitX, hitY)
          set({ projectile: { ...p, active: false }, isProcessingShot: false })
          return false

        case "napalm":
          get().addNapalmParticles(hitX, hitY, p.weapon.burnDuration || 60)
          get().applyDamage(hitX, hitY, p.weapon.radius, p.weapon.damage / 2)
          break

        case "digging":
          get().digTerrain(hitX, p.weapon.digDepth || 40, p.weapon.radius)
          get().addExplosion(hitX, hitY, p.weapon.radius / 2)
          get().applyDamage(hitX, hitY, p.weapon.radius, p.weapon.damage)
          break

        default:
          get().addExplosion(hitX, hitY, p.weapon.radius)
          get().deformTerrain(hitX, p.weapon.radius)
          get().applyDamage(hitX, hitY, p.weapon.radius, p.weapon.damage)
      }

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
      const newTanks = state.tanks.map((tank) => {
        const dist = Math.sqrt((tank.x - x) ** 2 + (tank.y - y) ** 2)
        if (dist < radius) {
          const damageMultiplier = 1 - dist / radius
          const actualDamage = Math.floor(damage * damageMultiplier)
          const newHealth = Math.max(0, tank.health - actualDamage)

          const attacker = state.tanks.find((t) => t.id === state.projectile?.tankId)
          if (attacker && attacker.id !== tank.id) {
            get().updateTank(attacker.id, { money: attacker.money + actualDamage * 5 })
          }

          return { ...tank, health: newHealth }
        }
        return tank
      })
      return { tanks: newTanks }
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

        const isBuried = terrainY > tank.y + 20

        if (isBuried && tank.health > 0) {
          const newHealth = Math.max(0, tank.health - 25)
          return { ...tank, y: newY, health: newHealth }
        }

        return { ...tank, y: newY }
      })

      return { terrain: newTerrain, tanks: newTanks }
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

        const isBuried = terrainY > tank.y + 20

        if (isBuried && tank.health > 0) {
          const newHealth = Math.max(0, tank.health - 25)
          return { ...tank, y: newY, health: newHealth }
        }

        return { ...tank, y: newY }
      })

      return { terrain: newTerrain, tanks: newTanks }
    }),

  buyWeapon: (tankId, weaponId) =>
    set((state) => {
      const tank = state.tanks.find((t) => t.id === tankId)
      if (!tank) return state

      const weaponTemplate = WEAPONS.find((w) => w.id === weaponId)
      if (!weaponTemplate || tank.money < weaponTemplate.price) return state

      const newWeapons = tank.weapons.map((w) => (w.id === weaponId ? { ...w, quantity: w.quantity + 5 } : w))

      return {
        tanks: state.tanks.map((t) =>
          t.id === tankId ? { ...t, money: t.money - weaponTemplate.price, weapons: newWeapons } : t,
        ),
      }
    }),

  buyItem: (tankId, itemId) =>
    set((state) => {
      const tank = state.tanks.find((t) => t.id === tankId)
      if (!tank) return state

      const item = { id: "shield", price: 200 }
      if (tank.money < item.price) return state

      const updates: Partial<Tank> = { money: tank.money - item.price }
      if (itemId === "shield") updates.shields = (tank.shields || 0) + 1
      if (itemId === "parachute") updates.parachutes = (tank.parachutes || 0) + 1

      return {
        tanks: state.tanks.map((t) => (t.id === tankId ? { ...t, ...updates } : t)),
      }
    }),

  endBuyingPhase: () => set({ phase: "battle" }),

  checkGameOver: () => {
    const state = get()
    const aliveTanks = state.tanks.filter((t) => t.health > 0)
    if (aliveTanks.length <= 1) {
      set({ phase: "gameOver", winner: aliveTanks[0] || null })
      return true
    }
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

      newParticles.forEach((p) => {
        if (p.life % 10 === 0) {
          get().applyDamage(p.x, state.terrain[Math.floor(p.x) + SCROLL_PADDING], 10, 3)
        }
      })

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
