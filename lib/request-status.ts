export const REQUEST_STATUS = {
  OPEN: { label: "Menunggu Pengepul", tone: "warning" },
  ASSIGNED: { label: "Diterima Pengepul", tone: "info" },
  ON_THE_WAY: { label: "Pengepul Menuju Lokasi", tone: "process" },
  ARRIVED: { label: "Pengepul Tiba", tone: "process" },
  WEIGHED: { label: "Sampah Ditimbang", tone: "info" },
  COMPLETED: { label: "Pickup Selesai", tone: "success" },
  CANCELLED: { label: "Dibatalkan", tone: "danger" },
} as const

export function getRequestStatus(status?: string | null) {
  return REQUEST_STATUS[status as keyof typeof REQUEST_STATUS] || { label: status || "Belum diketahui", tone: "info" }
}

export function getRequestStatusLabel(status?: string | null) {
  return getRequestStatus(status).label
}

export function formatWasteTypes(value?: string | null) {
  if (!value) return "Sampah rumah tangga"

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) && parsed.length ? parsed.join(" / ") : "Sampah rumah tangga"
  } catch {
    return value
  }
}
