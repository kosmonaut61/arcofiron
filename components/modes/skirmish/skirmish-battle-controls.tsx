"use client"

import { useSkirmishStore } from "@/lib/game-modes/skirmish/skirmish-store"
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

interface SkirmishBattleControlsProps {
  onOverlayChange?: (value: string | null, label: string | null) => void
}

export function SkirmishBattleControls({ onOverlayChange }: SkirmishBattleControlsProps) {
  const { tanks, currentTankIndex, updateTank, fireProjectile, isProcessingShot, phase } = useSkirmishStore()

  const currentTank = tanks[currentTankIndex]
  if (!currentTank || currentTank.isAI) return null

  const currentWeapon = currentTank.weapons[currentTank.currentWeapon]
  const canFire = phase === "battle" && !isProcessingShot

  const weaponsByCategory = currentTank.weapons.reduce(
    (acc, weapon, index) => {
      const category = weapon.category || "basic"
      if (!acc[category]) acc[category] = []
      acc[category].push({ weapon, index })
      return acc
    },
    {} as Record<string, { weapon: typeof currentWeapon; index: number }[]>,
  )

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
      <Button onClick={fireProjectile} disabled={!canFire} className="w-full h-9 bg-white/20 hover:bg-white/30 text-white border border-white/30">
        {isProcessingShot ? "firing..." : "fire"}
      </Button>

      {/* Status bar */}
      <div className="flex justify-between text-xs text-white/70 pt-1 border-t border-white/10">
        <span>health: {currentTank.health}%</span>
        <span>${currentTank.money}</span>
      </div>
    </div>
  )
}

