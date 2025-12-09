export type GameMode = "fullgame" | "skirmish" | "campaign" | "multiplayer" // Add more modes as needed

export interface GameModeInfo {
  id: GameMode
  name: string
  description: string
  icon?: string
}

export const GAME_MODES: GameModeInfo[] = [
  {
    id: "fullgame",
    name: "Full Game",
    description: "Complete Campaign",
  },
  {
    id: "skirmish",
    name: "Skirmish",
    description: "Quick Battle",
  },
  // Future modes can be added here
]

