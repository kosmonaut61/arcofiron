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
    description: "Complete campaign experience with progression and upgrades",
  },
  {
    id: "skirmish",
    name: "Skirmish",
    description: "Classic quick battle - the original Arc of Iron experience",
  },
  // Future modes can be added here
]

