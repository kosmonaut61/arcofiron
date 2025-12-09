"use client"

import { useGameStore } from "@/lib/game-store"
import { WEAPONS, SHOP_ITEMS, WEAPON_CATEGORIES, type WeaponCategory } from "@/lib/game-types"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function BuyingPhase() {
  const { tanks, buyWeapon, buyItem, endBuyingPhase } = useGameStore()
  const player = tanks.find((t) => t.id === "player")
  const [activeCategory, setActiveCategory] = useState<WeaponCategory | "defense">("basic")

  if (!player) return null

  const categoryWeapons = WEAPONS.filter((w) => w.category === activeCategory && w.price > 0)

  return (
    <div className="flex flex-col h-full min-h-0 p-4 gap-3">
      <div className="text-center">
        <h2 className="text-lg font-medium tracking-wide">armory</h2>
        <p className="text-sm text-muted-foreground">prepare for battle</p>
      </div>

      <div className="flex justify-between items-center px-3 py-2 bg-card rounded-lg border border-border">
        <span className="text-sm">credits</span>
        <span className="text-lg font-medium">${player.money}</span>
      </div>

      <div className="flex flex-wrap gap-1">
        {WEAPON_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-2 py-1 text-xs rounded border transition-colors ${
              activeCategory === cat.id
                ? "bg-foreground text-background border-foreground"
                : "bg-card border-border hover:bg-accent"
            }`}
          >
            {cat.name}
          </button>
        ))}
        <button
          onClick={() => setActiveCategory("defense")}
          className={`px-2 py-1 text-xs rounded border transition-colors ${
            activeCategory === "defense"
              ? "bg-foreground text-background border-foreground"
              : "bg-card border-border hover:bg-accent"
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
                  className="w-full flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg w-6 text-center">{weapon.icon}</span>
                    <div className="text-left">
                      <div className="text-sm font-medium">{weapon.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {weapon.damage > 0 ? `dmg ${weapon.damage} • ` : ""}r{weapon.radius}
                      </div>
                      <div className="text-xs text-muted-foreground/70">{weapon.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">${weapon.price}</div>
                    <div className="text-xs text-muted-foreground">×{owned}</div>
                  </div>
                </button>
              )
            })}
            {categoryWeapons.length === 0 && (
              <div className="text-center text-muted-foreground py-8 text-sm">
                No purchasable weapons in this category
              </div>
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
                  className="w-full flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-left">
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.type}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">${item.price}</div>
                    <div className="text-xs text-muted-foreground">×{owned}</div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <Button onClick={endBuyingPhase} className="w-full flex-shrink-0">
        ready for battle
      </Button>
    </div>
  )
}
