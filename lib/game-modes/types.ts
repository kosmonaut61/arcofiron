export type GameMode = "skirmish" | "campaign" | "multiplayer" // Add more modes as needed

export interface GameModeInfo {
  id: GameMode
  name: string
  description: string
  icon?: string
}

export const GAME_MODES: GameModeInfo[] = [
  {
    id: "skirmish",
    name: "Skirmish",
    description: "Classic quick battle - the original Arc of Iron experience",
  },
  // Future modes can be added here
]

