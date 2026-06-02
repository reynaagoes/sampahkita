export const POINT_RATES = {
  PLASTIC: 10,
  PAPER: 8,
  GLASS: 12,
  METAL: 20,
  ELECTRONIC: 50,
} as const

export const MATERIAL_POINT_RATES: Record<string, number> = {
  plastik: POINT_RATES.PLASTIC,
  kertas: POINT_RATES.PAPER,
  kaca: POINT_RATES.GLASS,
  logam: POINT_RATES.METAL,
  elektronik: POINT_RATES.ELECTRONIC,
}

export const WASTE_MATERIALS = [
  { id: "plastik", label: "Plastik", points: POINT_RATES.PLASTIC, desc: "Botol, kantong, wadah" },
  { id: "kertas", label: "Kertas", points: POINT_RATES.PAPER, desc: "Koran, kardus, buku" },
  { id: "logam", label: "Logam", points: POINT_RATES.METAL, desc: "Kaleng, besi, tembaga" },
  { id: "kaca", label: "Kaca", points: POINT_RATES.GLASS, desc: "Botol kaca, cermin" },
  { id: "elektronik", label: "Elektronik", points: POINT_RATES.ELECTRONIC, desc: "HP, kabel, baterai" },
] as const

export const BADGES = [
  { name: "Eco Starter", threshold: 100 },
  { name: "Eco Contributor", threshold: 500 },
  { name: "Eco Hero", threshold: 1000 },
  { name: "Eco Champion", threshold: 5000 },
] as const

export const REWARDS = [
  { code: "VOUCHER_5000", name: "Voucher Rp5.000", points: 100, description: "Voucher hemat untuk kebutuhan harian." },
  { code: "VOUCHER_10000", name: "Voucher Rp10.000", points: 200, description: "Reward untuk kontribusi rutinmu." },
  { code: "VOUCHER_25000", name: "Voucher Rp25.000", points: 500, description: "Reward untuk kontribusi berkelanjutan." },
] as const

export function parseWasteTypes(value?: string | null) {
  try {
    const parsed = JSON.parse(value || "[]")
    return Array.isArray(parsed) ? parsed.map((type) => String(type).toLowerCase()).filter(Boolean) : []
  } catch {
    return []
  }
}

export function allocateMaterialWeight(types: string[], totalWeight: number) {
  if (!types.length) return []
  const weight = totalWeight / types.length
  return types.map((wasteType) => ({ wasteType, weight }))
}

export function calculatePoints(types: string[], totalWeight: number) {
  return Math.round(
    allocateMaterialWeight(types, totalWeight).reduce(
      (sum, item) => sum + item.weight * (MATERIAL_POINT_RATES[item.wasteType] || 0),
      0
    )
  )
}

export function getNextBadge(totalPoints: number) {
  return BADGES.find((badge) => totalPoints < badge.threshold) || null
}
