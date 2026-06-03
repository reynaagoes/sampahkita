export const BATCH_STATUS = {
  AVAILABLE: { label: "Tersedia", tone: "success" },
  OFFER_SUBMITTED: { label: "Penawaran Diajukan", tone: "warning" },
  COUNTER_OFFERED: { label: "Harga Balik Diberikan", tone: "info" },
  APPROVED: { label: "Disetujui", tone: "success" },
  REJECTED: { label: "Ditolak", tone: "danger" },
  IN_DELIVERY: { label: "Dalam Pengiriman", tone: "process" },
  DELIVERED: { label: "Material Diserahkan", tone: "process" },
  COMPLETED: { label: "Selesai", tone: "success" },
  CANCELLED: { label: "Dibatalkan", tone: "danger" },
} as const

export type BatchStatusKey = keyof typeof BATCH_STATUS

export function normalizeBatchStatus(status?: string | null) {
  const normalized = String(status || "AVAILABLE").toUpperCase()
  if (normalized === "PURCHASE_REQUESTED") return "OFFER_SUBMITTED"
  return normalized
}

export function getBatchStatus(status?: string | null) {
  const normalized = normalizeBatchStatus(status) as BatchStatusKey
  return BATCH_STATUS[normalized] || { label: status || "Belum diketahui", tone: "info" }
}

export function getBatchStatusLabel(status?: string | null) {
  return getBatchStatus(status).label
}

export function getBatchStatusTone(status?: string | null) {
  return getBatchStatus(status).tone
}

export function getBatchFinance(agreedPrice?: number | string | null) {
  const value = Math.max(0, Math.round(Number(agreedPrice || 0)))
  const platformFee = Math.round(value * 0.05)
  const collectorEarning = Math.max(0, value - platformFee)
  return { agreedPrice: value, platformFee, collectorEarning }
}
