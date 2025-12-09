export interface Tank {
  id: string
  name: string
  x: number
  y: number
  angle: number
  power: number
  health: number
  maxHealth: number
  money: number
  color: string
  weapons: Weapon[]
  shields: number
  parachutes: number
  currentWeapon: number
  isAI: boolean
}

export type WeaponBehavior =
  | "standard" // Normal projectile
  | "bouncing" // LeapFrog - bounces before exploding
  | "splitting" // MIRV, Funky Bomb - splits into multiple projectiles
  | "rolling" // Rollers - rolls along terrain
  | "tracer" // Tracers - no damage, just shows trajectory
  | "napalm" // Burns and flows downhill
  | "digging" // Diggers - carves vertical holes

export type WeaponCategory =
  | "basic"
  | "nuclear"
  | "special"
  | "cluster"
  | "napalm"
  | "tracer"
  | "roller"
  | "riot"
  | "digger"

export interface Weapon {
  id: string
  name: string
  damage: number
  radius: number
  price: number
  quantity: number
  icon: string
  behavior: WeaponBehavior
  category: WeaponCategory
  description: string
  // Special properties
  bounces?: number // For LeapFrog
  splitCount?: number // For MIRV, Funky Bomb
  burnDuration?: number // For Napalm
  rollSpeed?: number // For Rollers
  digDepth?: number // For Diggers
}

export interface Projectile {
  x: number
  y: number
  vx: number
  vy: number
  weapon: Weapon
  tankId: string
  active: boolean
  bouncesLeft?: number // Track remaining bounces
  isSubProjectile?: boolean // For MIRV children
}

export interface Explosion {
  x: number
  y: number
  radius: number
  frame: number
  maxFrames: number
}

export interface NapalmParticle {
  x: number
  y: number
  life: number
  maxLife: number
}

export interface TerrainPoint {
  x: number
  y: number
}

export type GamePhase = "menu" | "buying" | "battle" | "turnEnd" | "gameOver"

export interface GameState {
  phase: GamePhase
  tanks: Tank[]
  currentTankIndex: number
  terrain: number[]
  wind: number
  projectile: Projectile | null
  subProjectiles: Projectile[] // For MIRV children
  explosions: Explosion[]
  napalmParticles: NapalmParticle[]
  tracerTrail: { x: number; y: number }[]
  round: number
  maxRounds: number
  winner: Tank | null
}

export const WEAPONS: Weapon[] = [
  // Basic weapons
  {
    id: "baby-missile",
    name: "Baby Missile",
    damage: 15,
    radius: 20,
    price: 0,
    quantity: 99,
    icon: "·",
    behavior: "standard",
    category: "basic",
    description: "Basic low-power projectile",
  },
  {
    id: "missile",
    name: "Missile",
    damage: 30,
    radius: 35,
    price: 50,
    quantity: 0,
    icon: "•",
    behavior: "standard",
    category: "basic",
    description: "Standard all-purpose weapon",
  },

  // Nuclear weapons
  {
    id: "baby-nuke",
    name: "Baby Nuke",
    damage: 50,
    radius: 55,
    price: 250,
    quantity: 0,
    icon: "○",
    behavior: "standard",
    category: "nuclear",
    description: "Miniature nuclear blast",
  },
  {
    id: "nuke",
    name: "Nuke",
    damage: 80,
    radius: 85,
    price: 500,
    quantity: 0,
    icon: "◉",
    behavior: "standard",
    category: "nuclear",
    description: "Massive devastating explosion",
  },
  {
    id: "deaths-head",
    name: "Death's Head",
    damage: 100,
    radius: 120,
    price: 1500,
    quantity: 0,
    icon: "☠",
    behavior: "standard",
    category: "nuclear",
    description: "Ultimate superweapon",
  },

  // Special weapons
  {
    id: "leapfrog",
    name: "LeapFrog",
    damage: 25,
    radius: 28,
    price: 150,
    quantity: 0,
    icon: "⌒",
    behavior: "bouncing",
    category: "special",
    description: "Bounces before exploding",
    bounces: 3,
  },

  // Cluster weapons
  {
    id: "mirv",
    name: "MIRV",
    damage: 20,
    radius: 25,
    price: 400,
    quantity: 0,
    icon: "⁂",
    behavior: "splitting",
    category: "cluster",
    description: "Splits into multiple missiles",
    splitCount: 5,
  },
  {
    id: "funky-bomb",
    name: "Funky Bomb",
    damage: 15,
    radius: 20,
    price: 350,
    quantity: 0,
    icon: "✺",
    behavior: "splitting",
    category: "cluster",
    description: "Chaotic scattered explosions",
    splitCount: 8,
  },

  // Napalm weapons
  {
    id: "napalm",
    name: "Napalm",
    damage: 25,
    radius: 40,
    price: 200,
    quantity: 0,
    icon: "🔥",
    behavior: "napalm",
    category: "napalm",
    description: "Burns and flows downhill",
    burnDuration: 60,
  },
  {
    id: "hot-napalm",
    name: "Hot Napalm",
    damage: 40,
    radius: 55,
    price: 400,
    quantity: 0,
    icon: "🔥",
    behavior: "napalm",
    category: "napalm",
    description: "Intense burning flames",
    burnDuration: 90,
  },

  // Tracers
  {
    id: "tracer",
    name: "Tracer",
    damage: 0,
    radius: 0,
    price: 10,
    quantity: 0,
    icon: "∘",
    behavior: "tracer",
    category: "tracer",
    description: "Shows trajectory, no damage",
  },
  {
    id: "smoke-tracer",
    name: "Smoke Tracer",
    damage: 0,
    radius: 0,
    price: 15,
    quantity: 0,
    icon: "◌",
    behavior: "tracer",
    category: "tracer",
    description: "Thick visible smoke trail",
  },

  // Rollers
  {
    id: "baby-roller",
    name: "Baby Roller",
    damage: 20,
    radius: 25,
    price: 75,
    quantity: 0,
    icon: "◦",
    behavior: "rolling",
    category: "roller",
    description: "Small rolling bomb",
    rollSpeed: 2,
  },
  {
    id: "roller",
    name: "Roller",
    damage: 35,
    radius: 35,
    price: 150,
    quantity: 0,
    icon: "○",
    behavior: "rolling",
    category: "roller",
    description: "Rolls into valleys",
    rollSpeed: 3,
  },
  {
    id: "heavy-roller",
    name: "Heavy Roller",
    damage: 50,
    radius: 50,
    price: 300,
    quantity: 0,
    icon: "●",
    behavior: "rolling",
    category: "roller",
    description: "Powerful rolling bomb",
    rollSpeed: 4,
  },

  // Riot weapons
  {
    id: "riot-charge",
    name: "Riot Charge",
    damage: 35,
    radius: 28,
    price: 100,
    quantity: 0,
    icon: "◆",
    behavior: "standard",
    category: "riot",
    description: "Compact high-damage shell",
  },
  {
    id: "riot-blast",
    name: "Riot Blast",
    damage: 45,
    radius: 38,
    price: 175,
    quantity: 0,
    icon: "◇",
    behavior: "standard",
    category: "riot",
    description: "Larger riot explosive",
  },
  {
    id: "riot-bomb",
    name: "Riot Bomb",
    damage: 55,
    radius: 48,
    price: 275,
    quantity: 0,
    icon: "◈",
    behavior: "standard",
    category: "riot",
    description: "High-damage blast",
  },
  {
    id: "heavy-riot-bomb",
    name: "Heavy Riot Bomb",
    damage: 70,
    radius: 60,
    price: 450,
    quantity: 0,
    icon: "❖",
    behavior: "standard",
    category: "riot",
    description: "Maximum riot damage",
  },

  // Diggers
  {
    id: "baby-digger",
    name: "Baby Digger",
    damage: 5,
    radius: 15,
    price: 50,
    quantity: 0,
    icon: "▾",
    behavior: "digging",
    category: "digger",
    description: "Small terrain removal",
    digDepth: 50,
  },
  {
    id: "digger",
    name: "Digger",
    damage: 10,
    radius: 22,
    price: 125,
    quantity: 0,
    icon: "▼",
    behavior: "digging",
    category: "digger",
    description: "Carves vertical shafts",
    digDepth: 100,
  },
]

export const SHOP_ITEMS = [
  { id: "shield", name: "Shield", price: 200, type: "defense" as const },
  { id: "parachute", name: "Parachute", price: 100, type: "utility" as const },
  { id: "fuel", name: "Fuel", price: 50, type: "utility" as const },
]

export const getWeaponsByCategory = (category: WeaponCategory): Weapon[] => {
  return WEAPONS.filter((w) => w.category === category)
}

export const WEAPON_CATEGORIES: { id: WeaponCategory; name: string }[] = [
  { id: "basic", name: "Basic" },
  { id: "nuclear", name: "Nuclear" },
  { id: "riot", name: "Riot" },
  { id: "cluster", name: "Cluster" },
  { id: "roller", name: "Rollers" },
  { id: "special", name: "Special" },
  { id: "napalm", name: "Napalm" },
  { id: "digger", name: "Diggers" },
  { id: "tracer", name: "Tracers" },
]
