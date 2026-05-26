"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navbar from "@/components/Navbar"

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats]                   = useState({ users: 0, pending: 0, transactions: 0, totalPoints: 0 })
  const [pendingCollectors, setPending]      = useState<any[]>([])
  const [recentRequests, setRecent]          = useState<any[]>([])
  const [tab, setTab]                        = useState<"overview"|"verifikasi"|"transaksi">("overview")
  const [loading, setLoading]               = useState(true)

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])
  useEffect(() => { if (status === "authenticated") fetchData() }, [status])

  async function fetchData() {
    setLoading(true)
    const [s, c, r] = await Promise.all([
      fetch("/api/admin/stats").then(x => x.json()),
      fetch("/api/admin/collectors").then(x => x.json()),
      fetch("/api/admin/requests").then(x => x.json()),
    ])
    setStats(s)
    setPending(c.collectors || [])
    setRecent(r.requests || [])
    setLoading(false)
  }

  async function verify(collectorId: string, action: "APPROVED"|"REJECTED") {
    await fetch("/api/admin/collectors", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectorId, action }),
    })
    fetchData()
  }

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center bg-white text-sm text-gray-400">Memuat...</div>

  const STATUS_STYLE: Record<string, [string,string]> = {
    OPEN: ["#fef9c3","#854d0e"], ASSIGNED: ["#dbeafe","#1e40af"],
    COMPLETED: ["#dcfce7","#166534"], CANCELLED: ["#fee2e2","#991b1b"],
  }

  const tabs = [
    { key: "overview",   label: "Overview" },
    { key: "verifikasi", label: `Verifikasi (${stats.pending})` },
    { key: "transaksi",  label: "Semua Transaksi" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session?.user?.name || ""} role="ADMIN" />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Kelola platform dan monitor aktivitas CuanSampah</p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total User",        value: stats.users,                              icon: "??", accent: "#16a34a" },
            { label: "Pending Verifikasi", value: stats.pending,                           icon: "?", accent: "#d97706" },
            { label: "Total Transaksi",   value: stats.transactions,                       icon: "??", accent: "#7c3aed" },
            { label: "Poin Beredar",      value: Number(stats.totalPoints).toLocaleString("id-ID"), icon: "??", accent: "#0891b2" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="text-xl mb-2">{s.icon}</div>
              <div className="text-xl font-bold mb-0.5" style={{ color: s.accent }}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex border-b border-gray-100 px-4 pt-4 gap-1">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key as any)}
                className="px-4 py-2 text-sm font-medium rounded-t-lg transition"
                style={tab === t.key ? { color: "#16a34a", borderBottom: "2px solid #16a34a", background: "#f0fdf4" } : { color: "#6b7280" }}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {loading ? (
              <div className="text-center py-10 text-sm text-gray-400">Memuat...</div>
            ) : tab === "verifikasi" ? (
              pendingCollectors.length === 0 ? (
                <div className="text-center py-14">
                  <div className="text-4xl mb-3">?</div>
                  <p className="text-sm text-gray-500">Tidak ada collector pending</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingCollectors.map((c: any) => (
                    <div key={c.id} className="flex justify-between items-center p-4 rounded-lg border border-gray-100">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{c.fullName}</p>
                        <p className="text-xs text-gray-500">{c.email} ¡¤ {c.phone}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: "#fef9c3", color: "#854d0e" }}>Pending</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => verify(c.id, "APPROVED")}
                          className="text-sm font-semibold text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
                          style={{ background: "#16a34a" }}>Setujui</button>
                        <button onClick={() => verify(c.id, "REJECTED")}
                          className="text-sm font-semibold px-4 py-2 rounded-lg border hover:bg-red-50 transition"
                          style={{ color: "#dc2626", borderColor: "#fca5a5" }}>Tolak</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : tab === "transaksi" ? (
              <div className="space-y-2">
                {recentRequests.map((req: any) => {
                  const types = JSON.parse(req.sampahTypes || "[]")
                  const [bg, color] = STATUS_STYLE[req.status] || ["#f3f4f6","#374151"]
                  return (
                    <div key={req.id} className="flex justify-between items-center p-4 rounded-lg border border-gray-50 hover:bg-gray-50">
                      <div>
                        <div className="flex gap-1.5 mb-1">
                          {types.map((t: string) => <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{t}</span>)}
                        </div>
                        <p className="text-sm font-medium text-gray-800">{req.addressDetail}</p>
                        <p className="text-xs text-gray-400">Dari: {req.householdName}{req.actualWeight && ` ¡¤ ${req.actualWeight} kg`}</p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: bg, color }}>{req.status}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl p-4 border border-gray-100">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Status Transaksi</p>
                  {["OPEN","ASSIGNED","COMPLETED","CANCELLED"].map(s => {
                    const count = recentRequests.filter(r => r.status === s).length
                    const [bg, color] = STATUS_STYLE[s] || ["#f3f4f6","#374151"]
                    return (
                      <div key={s} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: bg, color }}>{s}</span>
                        <span className="text-sm font-bold text-gray-700">{count}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="rounded-xl p-4 border border-gray-100">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Ringkasan Platform</p>
                  {[
                    ["Total Request", recentRequests.length],
                    ["Selesai", recentRequests.filter(r => r.status === "COMPLETED").length],
                    ["Poin Beredar", Number(stats.totalPoints).toLocaleString("id-ID")],
                  ].map(([label, val]) => (
                    <div key={label as string} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <span className="text-xs text-gray-500">{label}</span>
                      <span className="text-sm font-bold text-gray-700">{val}</span>
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
