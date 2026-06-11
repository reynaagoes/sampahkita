"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Navbar from "@/components/Navbar"

type VerificationItem = {
  id: string
  fullName: string
  email: string
  role: string
  phone?: string | null
  address?: string | null
  isVerified: boolean
  verificationStatus: string
  verificationNotes?: string | null
}

type HouseholdPointItem = {
  id: string
  fullName: string
  email: string
  totalPoints: number
}

type RewardCatalogItem = {
  rewardCode: string
  rewardName: string
  pointsCost: number
  totalRedeemed: number
  pending: number
  claimed: number
  cancelledOrExpired: number
}

type PickupItem = {
  id: string
  status: string
  sampahTypes?: string | null
  actualWeight?: number | null
  estimatedWeight?: number | null
  addressDetail?: string | null
  createdAt: string
  householdName?: string | null
  collectorName?: string | null
}

type BatchItem = {
  id: string
  status: string
  wasteType?: string | null
  totalWeight?: number | null
  agreedPrice: number
  platformFee: number
  collectorEarning: number
  createdAt: string
  updatedAt: string
  collectorName?: string | null
  recyclerName?: string | null
}

type GovernanceResponse = {
  stats: {
    users: number
    pending: number
    transactions: number
    totalPoints: number
  }
  verifications: VerificationItem[]
  points: {
    totalCirculating: number
    todayNet: number
    monthNet: number
    households: HouseholdPointItem[]
  }
  rewards: {
    empty: boolean
    totals: {
      totalRedeemed: number
      pending: number
      claimed: number
      cancelledOrExpired: number
    }
    catalog: RewardCatalogItem[]
  }
  transactions: {
    pickups: {
      counts: Record<string, number>
      recent: PickupItem[]
    }
    batches: {
      counts: Record<string, number>
      recent: BatchItem[]
    }
    finance: {
      totalBatchValue: number
      totalPlatformFee: number
      totalCollectorEarning: number
      batchesWithFinance: number
    }
  }
}

const PICKUP_STATUSES = ["OPEN", "ASSIGNED", "ON_THE_WAY", "ARRIVED", "WEIGHED", "COMPLETED", "CANCELLED"] as const
const BATCH_STATUSES = ["AVAILABLE", "OFFER_SUBMITTED", "COUNTER_OFFERED", "APPROVED", "REJECTED", "IN_DELIVERY", "DELIVERED", "COMPLETED", "CANCELLED"] as const

const STATUS_DOT: Record<string, string> = {
  OPEN: "#f59e0b",
  ASSIGNED: "#3b82f6",
  ON_THE_WAY: "#8b5cf6",
  ARRIVED: "#7c3aed",
  WEIGHED: "#2563eb",
  COMPLETED: "#16a34a",
  CANCELLED: "#ef4444",
  AVAILABLE: "#16a34a",
  OFFER_SUBMITTED: "#f59e0b",
  COUNTER_OFFERED: "#3b82f6",
  APPROVED: "#15803d",
  REJECTED: "#dc2626",
  IN_DELIVERY: "#7c3aed",
  DELIVERED: "#0f766e",
}

const EMPTY_GOVERNANCE: GovernanceResponse = {
  stats: { users: 0, pending: 0, transactions: 0, totalPoints: 0 },
  verifications: [],
  points: { totalCirculating: 0, todayNet: 0, monthNet: 0, households: [] },
  rewards: {
    empty: true,
    totals: { totalRedeemed: 0, pending: 0, claimed: 0, cancelledOrExpired: 0 },
    catalog: [],
  },
  transactions: {
    pickups: { counts: {}, recent: [] },
    batches: { counts: {}, recent: [] },
    finance: { totalBatchValue: 0, totalPlatformFee: 0, totalCollectorEarning: 0, batchesWithFinance: 0 },
  },
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString("id-ID")
}

function formatCurrency(value: number) {
  return `Rp${formatNumber(value)}`
}

function formatDate(value?: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function parseWasteTypes(value?: string | null) {
  try {
    const parsed = JSON.parse(value || "[]")
    return Array.isArray(parsed) ? parsed.join(" / ") : "-"
  } catch {
    return "-"
  }
}

function getVerificationLabel(status: string) {
  if (status === "APPROVED") return "Disetujui"
  if (status === "REJECTED") return "Ditolak"
  return "Menunggu verifikasi"
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [adjustingPoints, setAdjustingPoints] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [governance, setGovernance] = useState<GovernanceResponse>(EMPTY_GOVERNANCE)
  const [pointForm, setPointForm] = useState({
    userId: "",
    type: "ADD",
    amount: "",
    reason: "",
  })
  const role = String(session?.user?.role || "").toUpperCase()

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/governance", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal memuat dashboard admin")
      setGovernance(data)
      setPointForm((current) => ({
        ...current,
        userId: current.userId || data.points.households[0]?.id || "",
      }))
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Gagal memuat dashboard admin")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated" && role !== "ADMIN") {
      router.replace(role === "HOUSEHOLD" ? "/household" : role === "COLLECTOR" ? "/collector" : "/recycler")
    }
  }, [status, role, router])

  useEffect(() => {
    if (status === "authenticated" && role === "ADMIN") {
      const timer = window.setTimeout(() => {
        void fetchData()
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [status, role, fetchData])

  const tabs = useMemo(
    () => [
      { key: "overview", label: "Ringkasan" },
      { key: "verifikasi", label: `Verifikasi (${governance.verifications.length})` },
      { key: "poin", label: "Poin & Voucher" },
      { key: "transaksi", label: "Transaksi" },
    ],
    [governance.verifications.length]
  )

  async function handleVerification(userId: string, action: "APPROVE" | "REJECT") {
    setSubmittingId(`${userId}:${action}`)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui verifikasi")
      await fetchData()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Gagal memperbarui verifikasi")
    } finally {
      setSubmittingId(null)
    }
  }

  async function handlePointAdjustment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAdjustingPoints(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/points/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: pointForm.userId,
          type: pointForm.type,
          amount: Number(pointForm.amount),
          reason: pointForm.reason,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan penyesuaian poin")
      setPointForm((current) => ({ ...current, amount: "", reason: "" }))
      await fetchData()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Gagal menyimpan penyesuaian poin")
    } finally {
      setAdjustingPoints(false)
    }
  }

  if (status !== "authenticated" || role !== "ADMIN") {
    return <div className="page-loader">Memeriksa akses...</div>
  }

  const overviewCards = [
    { label: "Total User", value: governance.stats.users },
    { label: "Pending Verifikasi", value: governance.stats.pending },
    { label: "Total Transaksi", value: governance.stats.transactions },
    { label: "Poin Beredar", value: formatNumber(governance.stats.totalPoints) },
  ]

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <Navbar userName={session?.user?.name || ""} role="ADMIN" />
      <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#111", marginBottom: "2px" }}>Dashboard Admin</h1>
          <p style={{ fontSize: "13px", color: "#6b7280" }}>Pusat tata kelola platform untuk verifikasi, poin, reward, dan transaksi.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "1px", background: "#e5e7eb", borderRadius: "8px", overflow: "hidden", marginBottom: "24px" }}>
          {overviewCards.map((item) => (
            <div key={item.label} style={{ background: "#fff", padding: "18px 16px", borderBottom: item.label === "Pending Verifikasi" ? "2px solid #16a34a" : "2px solid transparent" }}>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "#111", lineHeight: 1, marginBottom: "4px" }}>{item.value}</div>
              <div style={{ fontSize: "10px", color: "#9ca3af" }}>{item.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ borderBottom: "1px solid #f3f4f6", display: "flex", flexWrap: "wrap" }}>
            {tabs.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                style={{
                  padding: "13px 20px",
                  fontSize: "12px",
                  fontWeight: "600",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  borderBottom: tab === item.key ? "2px solid #16a34a" : "2px solid transparent",
                  color: tab === item.key ? "#111" : "#9ca3af",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div style={{ padding: "20px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "32px", fontSize: "13px", color: "#9ca3af" }}>Memuat...</div>
            ) : error ? (
              <div style={{ padding: "14px 16px", borderRadius: "6px", border: "1px solid #fecaca", background: "#fef2f2", color: "#b91c1c", fontSize: "12px" }}>{error}</div>
            ) : tab === "verifikasi" ? (
              governance.verifications.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px", fontSize: "13px", color: "#9ca3af" }}>Tidak ada user collector atau recycler yang menunggu verifikasi.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {governance.verifications.map((item) => (
                    <div key={item.id} style={{ padding: "16px", border: "1px solid #f3f4f6", borderRadius: "8px", display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                          <p style={{ fontSize: "14px", fontWeight: "600", color: "#111" }}>{item.fullName}</p>
                          <span style={{ fontSize: "10px", fontWeight: "700", color: "#166534", background: "#dcfce7", borderRadius: "999px", padding: "3px 8px" }}>{item.role}</span>
                        </div>
                        <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>{item.email}</p>
                        <p style={{ fontSize: "12px", color: "#374151", marginBottom: "2px" }}>Phone: {item.phone || "-"}</p>
                        <p style={{ fontSize: "12px", color: "#374151", marginBottom: "4px" }}>Alamat: {item.address || "-"}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
                          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: item.verificationStatus === "REJECTED" ? "#ef4444" : "#f59e0b" }} />
                          <span style={{ fontSize: "11px", color: "#374151" }}>{getVerificationLabel(item.verificationStatus)}</span>
                          {item.verificationNotes ? <span style={{ fontSize: "11px", color: "#9ca3af" }}>({item.verificationNotes})</span> : null}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                        <button
                          onClick={() => handleVerification(item.id, "APPROVE")}
                          disabled={submittingId !== null}
                          style={{ padding: "8px 14px", borderRadius: "6px", border: "none", background: "#16a34a", color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer", opacity: submittingId && submittingId !== `${item.id}:APPROVE` ? 0.7 : 1 }}
                        >
                          {submittingId === `${item.id}:APPROVE` ? "Menyimpan..." : "Setujui"}
                        </button>
                        <button
                          onClick={() => handleVerification(item.id, "REJECT")}
                          disabled={submittingId !== null}
                          style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #e5e7eb", background: "#fff", color: "#dc2626", fontSize: "12px", fontWeight: "600", cursor: "pointer", opacity: submittingId && submittingId !== `${item.id}:REJECT` ? 0.7 : 1 }}
                        >
                          {submittingId === `${item.id}:REJECT` ? "Menyimpan..." : "Tolak"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : tab === "poin" ? (
              <div style={{ display: "grid", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px" }}>
                  {[
                    { label: "Total Poin Beredar", value: formatNumber(governance.points.totalCirculating) },
                    { label: "Poin Masuk Hari Ini", value: formatNumber(governance.points.todayNet) },
                    { label: "Poin Masuk Bulan Ini", value: formatNumber(governance.points.monthNet) },
                  ].map((item) => (
                    <div key={item.label} style={{ border: "1px solid #f3f4f6", borderRadius: "8px", padding: "16px" }}>
                      <div style={{ fontSize: "22px", fontWeight: "700", color: "#111", marginBottom: "4px" }}>{item.value}</div>
                      <div style={{ fontSize: "11px", color: "#6b7280" }}>{item.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "320px minmax(0, 1fr)", gap: "16px" }}>
                  <form onSubmit={handlePointAdjustment} style={{ border: "1px solid #f3f4f6", borderRadius: "8px", padding: "16px", display: "grid", gap: "12px", alignContent: "start" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#111" }}>Penyesuaian Poin</div>
                    <label style={{ display: "grid", gap: "6px" }}>
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>User household</span>
                      <select value={pointForm.userId} onChange={(event) => setPointForm((current) => ({ ...current, userId: event.target.value }))} style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "12px" }}>
                        <option value="">Pilih user</option>
                        {governance.points.households.map((item) => (
                          <option key={item.id} value={item.id}>{item.fullName}</option>
                        ))}
                      </select>
                    </label>
                    <label style={{ display: "grid", gap: "6px" }}>
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>Tipe</span>
                      <select value={pointForm.type} onChange={(event) => setPointForm((current) => ({ ...current, type: event.target.value }))} style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "12px" }}>
                        <option value="ADD">Tambah</option>
                        <option value="DEDUCT">Kurangi</option>
                      </select>
                    </label>
                    <label style={{ display: "grid", gap: "6px" }}>
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>Jumlah poin</span>
                      <input value={pointForm.amount} onChange={(event) => setPointForm((current) => ({ ...current, amount: event.target.value }))} inputMode="numeric" placeholder="100" style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "12px" }} />
                    </label>
                    <label style={{ display: "grid", gap: "6px" }}>
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>Alasan</span>
                      <textarea value={pointForm.reason} onChange={(event) => setPointForm((current) => ({ ...current, reason: event.target.value }))} rows={3} placeholder="Contoh: koreksi manual hasil audit" style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "12px", resize: "vertical" }} />
                    </label>
                    <button type="submit" disabled={adjustingPoints} style={{ padding: "10px 14px", borderRadius: "6px", border: "none", background: "#16a34a", color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                      {adjustingPoints ? "Menyimpan..." : "Simpan transaksi poin"}
                    </button>
                  </form>

                  <div style={{ border: "1px solid #f3f4f6", borderRadius: "8px", padding: "16px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#111", marginBottom: "12px" }}>Saldo Poin Household</div>
                    {governance.points.households.length === 0 ? (
                      <div style={{ fontSize: "12px", color: "#9ca3af" }}>Belum ada data household.</div>
                    ) : (
                      <div style={{ display: "grid", gap: "10px", maxHeight: "380px", overflowY: "auto" }}>
                        {governance.points.households.map((item) => (
                          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid #f9fafb" }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: "13px", fontWeight: "600", color: "#111" }}>{item.fullName}</div>
                              <div style={{ fontSize: "11px", color: "#9ca3af" }}>{item.email}</div>
                            </div>
                            <div style={{ fontSize: "13px", fontWeight: "700", color: "#166534" }}>{formatNumber(item.totalPoints)} poin</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ border: "1px solid #f3f4f6", borderRadius: "8px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "14px", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: "700", color: "#111", marginBottom: "4px" }}>Voucher & Reward</div>
                      <div style={{ fontSize: "11px", color: "#6b7280" }}>Ringkasan penukaran voucher di platform.</div>
                    </div>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ fontSize: "11px", color: "#374151" }}>Ditukar: <strong>{governance.rewards.totals.totalRedeemed}</strong></div>
                      <div style={{ fontSize: "11px", color: "#374151" }}>Menunggu: <strong>{governance.rewards.totals.pending}</strong></div>
                      <div style={{ fontSize: "11px", color: "#374151" }}>Diklaim: <strong>{governance.rewards.totals.claimed}</strong></div>
                      <div style={{ fontSize: "11px", color: "#374151" }}>Batal/Kedaluwarsa: <strong>{governance.rewards.totals.cancelledOrExpired}</strong></div>
                    </div>
                  </div>

                  {governance.rewards.empty ? (
                    <div style={{ textAlign: "center", padding: "28px", fontSize: "13px", color: "#9ca3af", border: "1px dashed #d1d5db", borderRadius: "8px" }}>Belum ada penukaran voucher.</div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px" }}>
                      {governance.rewards.catalog.map((item) => (
                        <div key={item.rewardCode} style={{ border: "1px solid #f3f4f6", borderRadius: "8px", padding: "14px" }}>
                          <div style={{ fontSize: "13px", fontWeight: "700", color: "#111", marginBottom: "4px" }}>{item.rewardName}</div>
                          <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "10px" }}>{item.pointsCost} poin</div>
                          <div style={{ display: "grid", gap: "6px" }}>
                            <div style={{ fontSize: "11px", color: "#374151" }}>Total ditukar: <strong>{item.totalRedeemed}</strong></div>
                            <div style={{ fontSize: "11px", color: "#374151" }}>Menunggu: <strong>{item.pending}</strong></div>
                            <div style={{ fontSize: "11px", color: "#374151" }}>Diklaim: <strong>{item.claimed}</strong></div>
                            <div style={{ fontSize: "11px", color: "#374151" }}>Batal/Kedaluwarsa: <strong>{item.cancelledOrExpired}</strong></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : tab === "transaksi" ? (
              <div style={{ display: "grid", gap: "16px" }}>
                <div style={{ border: "1px solid #f3f4f6", borderRadius: "8px", padding: "16px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#111", marginBottom: "12px" }}>Permintaan Pickup</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "8px", marginBottom: "14px" }}>
                    {PICKUP_STATUSES.map((item) => (
                      <div key={item} style={{ border: "1px solid #f3f4f6", borderRadius: "8px", padding: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: STATUS_DOT[item] || "#9ca3af" }} />
                          <div style={{ fontSize: "10px", color: "#6b7280" }}>{item}</div>
                        </div>
                        <div style={{ fontSize: "18px", fontWeight: "700", color: "#111" }}>{governance.transactions.pickups.counts[item] || 0}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gap: "10px" }}>
                    {governance.transactions.pickups.recent.length === 0 ? (
                      <div style={{ fontSize: "12px", color: "#9ca3af" }}>Belum ada pickup request.</div>
                    ) : (
                      governance.transactions.pickups.recent.map((item) => (
                        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: "12px", paddingBottom: "10px", borderBottom: "1px solid #f9fafb" }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "2px" }}>{parseWasteTypes(item.sampahTypes)}</div>
                            <div style={{ fontSize: "13px", fontWeight: "600", color: "#111", marginBottom: "2px" }}>{item.addressDetail || "-"}</div>
                            <div style={{ fontSize: "11px", color: "#6b7280" }}>
                              {item.householdName || "-"} | Collector: {item.collectorName || "-"} | Berat: {item.actualWeight || item.estimatedWeight || 0} kg
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end", marginBottom: "4px" }}>
                              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: STATUS_DOT[item.status] || "#9ca3af" }} />
                              <span style={{ fontSize: "11px", color: "#374151" }}>{item.status}</span>
                            </div>
                            <div style={{ fontSize: "11px", color: "#9ca3af" }}>{formatDate(item.createdAt)}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div style={{ border: "1px solid #f3f4f6", borderRadius: "8px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "12px", flexWrap: "wrap" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#111" }}>Transaksi Batch</div>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ fontSize: "11px", color: "#374151" }}>Nilai batch: <strong>{formatCurrency(governance.transactions.finance.totalBatchValue)}</strong></div>
                      <div style={{ fontSize: "11px", color: "#374151" }}>Biaya platform: <strong>{formatCurrency(governance.transactions.finance.totalPlatformFee)}</strong></div>
                      <div style={{ fontSize: "11px", color: "#374151" }}>Pendapatan pengepul: <strong>{formatCurrency(governance.transactions.finance.totalCollectorEarning)}</strong></div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(9, minmax(0, 1fr))", gap: "8px", marginBottom: "14px" }}>
                    {BATCH_STATUSES.map((item) => (
                      <div key={item} style={{ border: "1px solid #f3f4f6", borderRadius: "8px", padding: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: STATUS_DOT[item] || "#9ca3af" }} />
                          <div style={{ fontSize: "10px", color: "#6b7280" }}>{item}</div>
                        </div>
                        <div style={{ fontSize: "18px", fontWeight: "700", color: "#111" }}>{governance.transactions.batches.counts[item] || 0}</div>
                      </div>
                    ))}
                  </div>
                  {governance.transactions.finance.batchesWithFinance === 0 ? (
                    <div style={{ textAlign: "center", padding: "24px", border: "1px dashed #d1d5db", borderRadius: "8px", fontSize: "12px", color: "#9ca3af", marginBottom: "14px" }}>Belum ada data transaksi batch dengan nilai finansial.</div>
                  ) : null}
                  <div style={{ display: "grid", gap: "10px" }}>
                    {governance.transactions.batches.recent.length === 0 ? (
                      <div style={{ fontSize: "12px", color: "#9ca3af" }}>Belum ada transaksi batch.</div>
                    ) : (
                      governance.transactions.batches.recent.map((item) => (
                        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: "12px", paddingBottom: "10px", borderBottom: "1px solid #f9fafb" }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "13px", fontWeight: "600", color: "#111", marginBottom: "2px" }}>{item.wasteType || "-"} · {Number(item.totalWeight || 0)} kg</div>
                            <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "2px" }}>Collector: {item.collectorName || "-"} | Recycler: {item.recyclerName || "-"}</div>
                            <div style={{ fontSize: "11px", color: "#374151" }}>
                              Agreed: {formatCurrency(item.agreedPrice)} | Fee: {formatCurrency(item.platformFee)} | Earning: {formatCurrency(item.collectorEarning)}
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end", marginBottom: "4px" }}>
                              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: STATUS_DOT[item.status] || "#9ca3af" }} />
                              <span style={{ fontSize: "11px", color: "#374151" }}>{item.status}</span>
                            </div>
                            <div style={{ fontSize: "11px", color: "#9ca3af" }}>{formatDate(item.updatedAt || item.createdAt)}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" }}>
                <div style={{ border: "1px solid #f3f4f6", borderRadius: "8px", padding: "16px" }}>
                  <div style={{ fontSize: "10px", fontWeight: "700", color: "#374151", letterSpacing: "1px", marginBottom: "12px" }}>GOVERNANCE</div>
                  {[
                    ["Collector/Recycler belum verifikasi", governance.verifications.length],
                    ["Reward menunggu klaim", governance.rewards.totals.pending],
                    ["Pickup aktif", (governance.transactions.pickups.counts.OPEN || 0) + (governance.transactions.pickups.counts.ASSIGNED || 0) + (governance.transactions.pickups.counts.ON_THE_WAY || 0) + (governance.transactions.pickups.counts.ARRIVED || 0) + (governance.transactions.pickups.counts.WEIGHED || 0)],
                    ["Batch aktif", (governance.transactions.batches.counts.AVAILABLE || 0) + (governance.transactions.batches.counts.OFFER_SUBMITTED || 0) + (governance.transactions.batches.counts.COUNTER_OFFERED || 0) + (governance.transactions.batches.counts.APPROVED || 0) + (governance.transactions.batches.counts.IN_DELIVERY || 0) + (governance.transactions.batches.counts.DELIVERED || 0)],
                  ].map(([label, value]) => (
                    <div key={String(label)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #f9fafb" }}>
                      <span style={{ fontSize: "12px", color: "#374151" }}>{label}</span>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#111" }}>{value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ border: "1px solid #f3f4f6", borderRadius: "8px", padding: "16px" }}>
                  <div style={{ fontSize: "10px", fontWeight: "700", color: "#374151", letterSpacing: "1px", marginBottom: "12px" }}>RINGKASAN NILAI</div>
                  {[
                    ["Poin beredar", `${formatNumber(governance.points.totalCirculating)} poin`],
                    ["Total voucher ditukar", governance.rewards.totals.totalRedeemed],
                    ["Total biaya platform", formatCurrency(governance.transactions.finance.totalPlatformFee)],
                    ["Pendapatan pengepul", formatCurrency(governance.transactions.finance.totalCollectorEarning)],
                  ].map(([label, value]) => (
                    <div key={String(label)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #f9fafb" }}>
                      <span style={{ fontSize: "12px", color: "#374151" }}>{label}</span>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#111" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
