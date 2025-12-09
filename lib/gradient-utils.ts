// Palette colors (excluding black)
export const PALETTE_COLORS = [
  "#ffffff",
  "#fff8e7",
  "#fae6be",
  "#f5d491",
  "#f2c56f",
  "#f5a623",
  "#eb6b0a",
  "#e02d0e",
  "#a81b17",
  "#6e1420",
  "#2f0e1b",
  "#571735",
  "#8a2550",
  "#b24a6e",
  "#d87691",
  "#f4a4b4",
  "#f2c7cf",
  "#deebe8",
  "#b1dbce",
  "#78c9ad",
  "#4eb58a",
  "#36a166",
  "#288b4f",
  "#1e7540",
  "#175c32",
  "#114225",
  "#1b4a35",
  "#2c5a4a",
  "#3f6a60",
  "#537a76",
  "#6a8a8a",
  "#88a2a2",
  "#a7baba",
  "#c8d4d4",
  "#e4ebea",
  "#f0f4f3",
  "#e0e8f0",
  "#c4d4e4",
  "#a4c0d8",
  "#84a8cc",
  "#6492be",
  "#4a7cad",
  "#366699",
  "#255080",
  "#1a3a66",
  "#0e264d",
  "#0a1a36",
  "#97d9e9",
  "#55c1db",
  "#23a8c9",
  "#1290b0",
  "#0a7890",
  "#0a6070",
  "#0b4850",
  "#0c3438",
  "#0c2426",
  "#c4f0f0",
  "#8ae0e0",
  "#50d0d0",
  "#28c0c0",
  "#10a8a8",
  "#0a9090",
  "#087878",
  "#066060",
  "#044848",
]

export function getRandomGradientColors(): string[] {
  const shuffled = [...PALETTE_COLORS].sort(() => Math.random() - 0.5)
  return [shuffled[0], shuffled[1], shuffled[2]]
}

export function lerpColor(color1: string, color2: string, t: number): string {
  const r1 = Number.parseInt(color1.slice(1, 3), 16)
  const g1 = Number.parseInt(color1.slice(3, 5), 16)
  const b1 = Number.parseInt(color1.slice(5, 7), 16)
  const r2 = Number.parseInt(color2.slice(1, 3), 16)
  const g2 = Number.parseInt(color2.slice(3, 5), 16)
  const b2 = Number.parseInt(color2.slice(5, 7), 16)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r}, ${g}, ${b})`
}

export function generateGradientBands(colors: string[], bandCount = 11): string[] {
  const [color1, color2, color3] = colors
  const bands: string[] = []

  for (let i = 0; i < bandCount; i++) {
    const t = i / (bandCount - 1)
    let color: string
    if (t < 0.5) {
      color = lerpColor(color1, color2, t * 2)
    } else {
      color = lerpColor(color2, color3, (t - 0.5) * 2)
    }
    bands.push(color)
  }

  return bands
}
