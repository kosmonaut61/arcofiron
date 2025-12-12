"use client"

import { useGameStore } from "@/lib/game-store"
import { WEAPONS, SHOP_ITEMS, WEAPON_CATEGORIES, type WeaponCategory } from "@/lib/game-types"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { getRandomGradientColors, generateGradientBands } from "@/lib/gradient-utils"

const MECH_COLORS = [
  { name: "Green", value: "#36a166" },
  { name: "Blue", value: "#366699" },
  { name: "Red", value: "#e02d0e" },
  { name: "Purple", value: "#8a2550" },
  { name: "Orange", value: "#f5a623" },
  { name: "Cyan", value: "#23a8c9" },
]

export function BuyingPhase() {
  const { tanks, buyWeapon, buyItem, endBuyingPhase, setMechColor } = useGameStore()
  const player = tanks.find((t) => t.id === "player")
  const [activeCategory, setActiveCategory] = useState<WeaponCategory | "defense">("basic")
  const [showColorDropdown, setShowColorDropdown] = useState(false)

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

  if (!player) return null

  const categoryWeapons = WEAPONS.filter((w) => w.category === activeCategory && w.price > 0)

  return (
    <div ref={containerRef} className="relative flex items-center justify-center h-full p-6">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ imageRendering: "pixelated" }} />

      <div className="relative z-10 w-full max-w-5xl h-full flex flex-col rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl p-6 gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-medium tracking-widest text-white">armory</h2>
            <p className="text-sm text-white/70 tracking-wide">prepare for battle</p>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowColorDropdown(!showColorDropdown)}
              className="w-10 h-10 rounded border-2 border-white/20 hover:border-white/40 transition-colors flex items-center justify-center relative"
              style={{ backgroundColor: player.mechColor }}
              aria-label="Select mech color"
            >
              <ChevronDown className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
            </button>
            {showColorDropdown && (
              <div className="absolute right-0 top-12 bg-black/60 backdrop-blur-md border border-white/20 rounded-lg shadow-lg p-2 flex flex-col gap-2 z-10">
                {MECH_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      setMechColor(player.id, color.value)
                      setShowColorDropdown(false)
                    }}
                    className="w-8 h-8 rounded border-2 border-white/20 hover:border-white/60 transition-colors"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center px-4 py-3 bg-white/10 rounded-lg border border-white/20">
          <span className="text-sm text-white/80">credits</span>
          <span className="text-xl font-medium text-white">${player.money}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {WEAPON_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                activeCategory === cat.id
                  ? "bg-white/30 text-white border-white/40"
                  : "bg-white/10 border-white/20 hover:bg-white/20 text-white/80"
              }`}
            >
              {cat.name}
            </button>
          ))}
          <button
            onClick={() => setActiveCategory("defense")}
            className={`px-3 py-1.5 text-xs rounded border transition-colors ${
              activeCategory === "defense"
                ? "bg-white/30 text-white border-white/40"
                : "bg-white/10 border-white/20 hover:bg-white/20 text-white/80"
            }`}
          >
            Defense
          </button>
        </div>

        <div className="flex-1 overflow-auto min-h-0">
          {activeCategory !== "defense" ? (
            <div className="space-y-2">
              {categoryWeapons.map((weapon) => {
                const owned = player.weapons.find((w) => w.id === weapon.id)?.quantity || 0
                const canAfford = player.money >= weapon.price

                return (
                  <button
                    key={weapon.id}
                    onClick={() => buyWeapon(player.id, weapon.id)}
                    disabled={!canAfford}
                    className="w-full flex items-center justify-between p-4 bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg w-6 text-center">{weapon.icon}</span>
                      <div className="text-left">
                        <div className="text-sm font-medium text-white">{weapon.name}</div>
                        <div className="text-xs text-white/70">
                          {weapon.damage > 0 ? `dmg ${weapon.damage} • ` : ""}r{weapon.radius}
                        </div>
                        <div className="text-xs text-white/60">{weapon.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white">${weapon.price}</div>
                      <div className="text-xs text-white/60">×{owned}</div>
                    </div>
                  </button>
                )
              })}
              {categoryWeapons.length === 0 && (
                <div className="text-center text-white/60 py-8 text-sm">No purchasable weapons in this category</div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {SHOP_ITEMS.map((item) => {
                const canAfford = player.money >= item.price
                const owned = item.id === "shield" ? player.shields : item.id === "parachute" ? player.parachutes : 0

                return (
                  <button
                    key={item.id}
                    onClick={() => buyItem(player.id, item.id)}
                    disabled={!canAfford}
                    className="w-full flex items-center justify-between p-4 bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">{item.name}</div>
                      <div className="text-xs text-white/70">{item.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white">${item.price}</div>
                      <div className="text-xs text-white/60">×{owned}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <Button
          onClick={endBuyingPhase}
          className="w-full flex-shrink-0 bg-white/20 hover:bg-white/30 text-white border border-white/30"
        >
          ready for battle
        </Button>
      </div>
    </div>
  )
}
