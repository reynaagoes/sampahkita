export function normalizePhoneDigits(phone?: string | null) {
  return String(phone || "").replace(/\D/g, "")
}

export function normalizeWhatsAppPhone(phone?: string | null) {
  const digits = normalizePhoneDigits(phone)
  if (!digits) return ""
  if (digits.startsWith("0")) return `62${digits.slice(1)}`
  if (digits.startsWith("62")) return digits
  return digits
}

export function getWhatsAppUrl(phone?: string | null) {
  const normalized = normalizeWhatsAppPhone(phone)
  return normalized ? `https://wa.me/${normalized}` : ""
}
