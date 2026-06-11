import { getRequestStatusLabel } from "@/lib/request-status"

type PickupTimelineProps = {
  status: string
  createdAt?: string
  updatedAt?: string
  collector?: {
    fullName?: string | null
    phone?: string | null
  } | null
  actualWeight?: number | string | null
  pointsAwarded?: number | string | null
  compact?: boolean
}

const ACTIVE_STEPS = [
  {
    status: "OPEN",
    label: "Permintaan dibuat",
    description: "Permintaan penjemputan sudah dibuat dan sedang menunggu pengepul.",
  },
  {
    status: "ASSIGNED",
    label: "Pengepul menerima permintaan",
    description: "Pengepul sudah menerima permintaan penjemputan.",
  },
  {
    status: "ON_THE_WAY",
    label: "Pengepul menuju lokasi",
    description: "Pengepul sedang dalam perjalanan ke alamat penjemputan.",
  },
  {
    status: "ARRIVED",
    label: "Pengepul tiba di lokasi",
    description: "Pengepul sudah tiba dan siap mengambil sampah.",
  },
  {
    status: "WEIGHED",
    label: "Sampah ditimbang",
    description: "Berat aktual sampah sudah dicatat.",
  },
  {
    status: "COMPLETED",
    label: "Pickup selesai",
    description: "Penjemputan selesai dan poin sudah diberikan.",
  },
]

const CANCELLED_STEP = {
  status: "CANCELLED",
  label: "Permintaan dibatalkan",
  description: "Permintaan ini dibatalkan.",
}

function formatDateTime(value?: string) {
  if (!value) return ""
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function StepMarker({ completed, active }: { completed: boolean; active: boolean }) {
  if (completed) {
    return (
      <span className="pickup-timeline-marker" aria-hidden="true">
        <svg viewBox="0 0 16 16" focusable="false">
          <path d="M6.4 10.7 3.7 8l-1 1 3.7 3.7 7-7-1-1z" />
        </svg>
      </span>
    )
  }

  return <span className={`pickup-timeline-marker ${active ? "current" : ""}`} aria-hidden="true" />
}

export default function PickupTimeline({
  status,
  createdAt,
  updatedAt,
  collector,
  actualWeight,
  pointsAwarded,
  compact = false,
}: PickupTimelineProps) {
  const normalizedStatus = String(status || "OPEN").toUpperCase()
  const steps = normalizedStatus === "CANCELLED" ? [ACTIVE_STEPS[0], CANCELLED_STEP] : ACTIVE_STEPS
  const activeIndex = Math.max(0, steps.findIndex((step) => step.status === normalizedStatus))
  const lastUpdated = formatDateTime(updatedAt)

  return (
    <div className={`pickup-timeline ${compact ? "pickup-timeline-compact" : ""}`} aria-label={`Tracking pickup: ${getRequestStatusLabel(normalizedStatus)}`}>
      {steps.map((step, index) => {
        const isCompleted = normalizedStatus !== "CANCELLED" && index < activeIndex
        const isActive = index === activeIndex
        const className = isCompleted
          ? "pickup-timeline-step pickup-timeline-step-completed"
          : isActive
            ? "pickup-timeline-step pickup-timeline-step-active"
            : "pickup-timeline-step pickup-timeline-step-pending"

        return (
          <div className={className} key={step.status}>
            <StepMarker completed={isCompleted} active={isActive} />
            <div className="pickup-timeline-content">
              <div className="pickup-timeline-title-row">
                <strong>{step.label}</strong>
                {step.status === "OPEN" && createdAt && <time>{formatDateTime(createdAt)}</time>}
              </div>
              {!compact && <p>{step.description}</p>}
              {step.status === "ASSIGNED" && collector?.fullName && <small>Pengepul: {collector.fullName}</small>}
              {step.status === "WEIGHED" && actualWeight && <small>Berat aktual: {Number(actualWeight).toFixed(1)} kg</small>}
              {step.status === "COMPLETED" && pointsAwarded && <small>Poin diterima: {Number(pointsAwarded).toLocaleString("id-ID")} poin</small>}
            </div>
          </div>
        )
      })}
      {lastUpdated && <p className="pickup-timeline-updated">Terakhir diperbarui: {lastUpdated}</p>}
    </div>
  )
}
