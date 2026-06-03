import { getBatchStatusLabel, normalizeBatchStatus } from "@/lib/batch-status"

type BatchPurchaseTimelineProps = {
  status: string
  updatedAt?: string | null
  agreedPrice?: number | string | null
  platformFee?: number | string | null
  collectorEarning?: number | string | null
  compact?: boolean
}

const STEPS = [
  {
    label: "Penawaran diajukan",
    description: "Recycler mengajukan harga tawar untuk batch material.",
  },
  {
    label: "Penawaran disetujui / harga disepakati",
    description: "Collector menerima, menolak, atau memberi harga balik sampai deal tercapai.",
  },
  {
    label: "Collector mengirim material",
    description: "Collector menyiapkan dan mengirim material ke alamat recycler.",
  },
  {
    label: "Material diserahkan",
    description: "Collector sudah menandai material diserahkan di tujuan.",
  },
  {
    label: "Recycler mengonfirmasi diterima",
    description: "Recycler memastikan material yang diterima sesuai.",
  },
  {
    label: "Transaksi selesai",
    description: "Transaksi ditutup dan riwayat tersimpan.",
  },
]

function formatMoney(value?: number | string | null) {
  const amount = Math.round(Number(value || 0))
  return amount ? `Rp ${amount.toLocaleString("id-ID")}` : "-"
}

export default function BatchPurchaseTimeline({
  status,
  updatedAt,
  agreedPrice,
  platformFee,
  collectorEarning,
  compact = false,
}: BatchPurchaseTimelineProps) {
  const normalizedStatus = normalizeBatchStatus(status)
  const progressMap: Record<string, number> = {
    AVAILABLE: 0,
    OFFER_SUBMITTED: 0,
    COUNTER_OFFERED: 1,
    APPROVED: 1,
    IN_DELIVERY: 2,
    DELIVERED: 3,
    COMPLETED: 5,
    REJECTED: -1,
    CANCELLED: -1,
  }
  const activeIndex = progressMap[normalizedStatus] ?? 0

  return (
    <div className={`batch-timeline ${compact ? "batch-timeline-compact" : ""}`}>
      {STEPS.map((step, index) => {
        const isCompleted = activeIndex >= index + 1 || (normalizedStatus === "COMPLETED" && index < STEPS.length)
        const isActive = activeIndex === index
        const className = isCompleted
          ? "batch-timeline-step batch-timeline-step-completed"
          : isActive
            ? "batch-timeline-step batch-timeline-step-active"
            : "batch-timeline-step batch-timeline-step-pending"

        return (
          <div className={className} key={step.label}>
            <span className="batch-timeline-marker" aria-hidden="true">{isCompleted ? "✓" : ""}</span>
            <div>
              <strong>{step.label}</strong>
              {!compact && <p>{step.description}</p>}
            </div>
          </div>
        )
      })}
      {!compact && (
        <div className="batch-timeline-summary">
          <span>Status: {getBatchStatusLabel(status)}</span>
          <span>Harga deal: {formatMoney(agreedPrice)}</span>
          <span>Platform fee 5%: {formatMoney(platformFee)}</span>
          <span>Pendapatan collector: {formatMoney(collectorEarning)}</span>
        </div>
      )}
      {updatedAt && <p className="batch-timeline-updated">Terakhir diperbarui: {new Date(updatedAt).toLocaleString("id-ID")}</p>}
    </div>
  )
}
