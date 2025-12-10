"use client"

import { useFullGameStore } from "@/lib/game-modes/fullgame/fullgame-store"
import { Button } from "@/components/ui/button"
import { ArcSlider } from "@/components/arc-slider"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface FullGameBattleControlsProps {
  onOverlayChange?: (value: string | null, label: string | null) => void
}

export function FullGameBattleControls({ onOverlayChange }: FullGameBattleControlsProps) {
  const { tanks, currentTankIndex, updateTank, fireProjectile, isProcessingShot, phase, inventory } = useFullGameStore()

  const currentTank = tanks[currentTankIndex]
  if (!currentTank) return null

  const currentWeapon = currentTank.weapons[currentTank.currentWeapon]
  const canFire = phase === "battle" && !isProcessingShot

  // Separate extractors from weapons
  const extractors = currentTank.weapons.filter((w) => w.id.includes("extractor"))
  const regularWeapons = currentTank.weapons.filter((w) => !w.id.includes("extractor"))

  const weaponsByCategory = regularWeapons.reduce(
    (acc, weapon, index) => {
      // Adjust index to account for extractors
      const actualIndex = extractors.length + index
      const category = weapon.category || "basic"
      if (!acc[category]) acc[category] = []
      acc[category].push({ weapon, index: actualIndex })
      return acc
    },
    {} as Record<string, { weapon: typeof currentWeapon; index: number }[]>,
  )

  const extractorsGroup = extractors.map((weapon, index) => ({ weapon, index }))

  const categoryOrder = ["basic", "nuclear", "riot", "cluster", "roller", "special", "napalm", "digger", "tracer"]
  const categoryLabels: Record<string, string> = {
    basic: "Basic",
    nuclear: "Nuclear",
    riot: "Riot",
    cluster: "Cluster",
    roller: "Rollers",
    special: "Special",
    napalm: "Napalm",
    digger: "Diggers",
    tracer: "Tracers",
  }

  return (
    <div className="flex flex-col px-4 py-2 gap-1">
      {/* Weapon selector */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <Select
            value={currentTank.currentWeapon.toString()}
            onValueChange={(value) => updateTank(currentTank.id, { currentWeapon: Number.parseInt(value) })}
            disabled={!canFire}
          >
            <SelectTrigger className="w-full h-8 text-sm bg-white/10 border-white/20 text-white hover:bg-white/20">
              <SelectValue>
                <span className="flex items-center gap-1 text-white">
                  <span>{currentWeapon.icon}</span>
                  <span className="truncate">{currentWeapon.name}</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-black/60 backdrop-blur-md border-white/20 text-white">
              {/* Extractors at top */}
              {extractorsGroup.length > 0 && (
                <SelectGroup>
                  <SelectLabel className="text-xs uppercase tracking-widest text-white/70">Extractors</SelectLabel>
                  {extractorsGroup.map(({ weapon, index }) => (
                    <SelectItem key={weapon.id} value={index.toString()} className="flex items-center gap-2 text-white focus:bg-white/20">
                      <span className="flex items-center gap-2 w-full">
                        <span>{weapon.icon}</span>
                        <span className="flex-1">{weapon.name}</span>
                        <span className="text-xs text-white/60">∞</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}

              {/* Regular weapons */}
              {categoryOrder.map((category) => {
                const weapons = weaponsByCategory[category]
                if (!weapons || weapons.length === 0) return null
                return (
                  <SelectGroup key={category}>
                    <SelectLabel className="text-xs uppercase tracking-widest text-white/70">{categoryLabels[category]}</SelectLabel>
                    {weapons.map(({ weapon, index }) => {
                      const isDisabled = weapon.quantity <= 0 && weapon.price > 0
                      return (
                        <SelectItem
                          key={weapon.id}
                          value={index.toString()}
                          disabled={isDisabled}
                          className="flex items-center gap-2 text-white focus:bg-white/20"
                        >
                          <span className="flex items-center gap-2 w-full">
                            <span>{weapon.icon}</span>
                            <span className="flex-1">{weapon.name}</span>
                            <span className="text-xs text-white/60">
                              ×{weapon.quantity === 99 ? "∞" : weapon.quantity}
                            </span>
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectGroup>
                )
              })}
            </SelectContent>
          </Select>
        </div>
        <span className="text-xs text-white/70 whitespace-nowrap">
          ×{currentWeapon.quantity === 99 ? "∞" : currentWeapon.quantity}
        </span>
      </div>

      {/* Arc sliders */}
      <div className="flex justify-between gap-4">
        {/* Angle control */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => updateTank(currentTank.id, { angle: Math.max(0, currentTank.angle - 1) })}
            disabled={!canFire || currentTank.angle <= 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <ArcSlider
            value={currentTank.angle}
            min={0}
            max={180}
            onChange={(value) => updateTank(currentTank.id, { angle: value })}
            label="angle"
            unit="°"
            disabled={!canFire}
            onDragStart={() => onOverlayChange?.(`${currentTank.angle}°`, "angle")}
            onDragEnd={() => onOverlayChange?.(null, null)}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => updateTank(currentTank.id, { angle: Math.min(180, currentTank.angle + 1) })}
            disabled={!canFire || currentTank.angle >= 180}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Power control */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => updateTank(currentTank.id, { power: Math.max(10, currentTank.power - 1) })}
            disabled={!canFire || currentTank.power <= 10}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <ArcSlider
            value={currentTank.power}
            min={10}
            max={100}
            onChange={(value) => updateTank(currentTank.id, { power: value })}
            label="power"
            unit="%"
            disabled={!canFire}
            onDragStart={() => onOverlayChange?.(`${currentTank.power}%`, "power")}
            onDragEnd={() => onOverlayChange?.(null, null)}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => updateTank(currentTank.id, { power: Math.min(100, currentTank.power + 1) })}
            disabled={!canFire || currentTank.power >= 100}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Fire button */}
      <Button 
        onClick={() => {
          console.log('[BUTTON] Fire button clicked!', { canFire, phase, isProcessingShot })
          fireProjectile()
        }} 
        disabled={!canFire} 
        className="w-full h-9 bg-white/20 hover:bg-white/30 text-white border border-white/30"
      >
        {isProcessingShot ? "firing..." : "fire"}
      </Button>

      {/* Status bar */}
      <div className="flex justify-between items-center gap-3 pt-2 border-t border-white/10 text-xs">
        <span className="text-white/70">health: {currentTank.health}%</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-white/70">iron:</span>
            <span className="font-semibold" style={{ color: "oklch(0.65 0.15 220)" }}>
              {inventory.iron}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-white/70">copper:</span>
            <span className="font-semibold" style={{ color: "oklch(0.70 0.20 60)" }}>
              {inventory.copper}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-white/70">oil:</span>
            <span className="font-semibold" style={{ color: "oklch(0.50 0.10 0)" }}>
              {inventory.oil}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

