"use client"

import { create } from "zustand"
import { type GamePhase } from "./game-types"
import { type GameMode } from "./game-modes/types"

interface BaseGameStore {
  phase: GamePhase
  gameMode: GameMode | null
  setPhase: (phase: GamePhase) => void
  setGameMode: (mode: GameMode | null) => void
  reset: () => void
}

export const useBaseGameStore = create<BaseGameStore>((set) => ({
  phase: "menu",
  gameMode: null,
  setPhase: (phase) => set({ phase }),
  setGameMode: (gameMode) => set({ gameMode }),
  reset: () => set({ phase: "menu", gameMode: null }),
}))

