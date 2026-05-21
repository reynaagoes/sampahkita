"use client"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({ users: 0, pending: 0, transactions: 0, totalPoints: 0 })
  const [pendingCollectors, setPendingCollectors] = useState<any[]>([])
  const [recentRequests, setRecentRequests] = useState<any[]>([])
  const [tab, setTab] = useState<"overview" | "verifikasi" | "transaksi">("overview")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") fetchData()
  }, [status])

  async function fetchData() {
    setLoading(true)
    const [statsRes, collectorsRes, requestsRes] = await Promise.all([
      fetch("/api/admin/stats").then(r => r.json()),
      fetch("/api/admin/collectors").then(r => r.json()),
      fetch("/api/admin/requests").then(r => r.json()),
    ])
    setStats(statsRes)
    setPendingCollectors(collectorsRes.collectors || [])
    setRecentRequests(requestsRes.requests || [])
    setLoading(false)
  }

  async function verifyCollector(collectorId: string, action: "APPROVED" | "REJECTED") {
    await fetch("/api/admin/collectors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectorId, action }),
    })
    fetchData()
  }

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  const STATUS_COLOR: Record<string, string> = {
    OPEN: "bg-yellow-100 text-yellow-700",
    ASSIGNED: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-green-700">SampahKita</span>
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Halo, {session?.user?.name}</span>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-sm text-red-500 hover:text-red-700">Keluar</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-sm text-gray-500">Total User</p>
            <p className="text-3xl font-bold text-green-600">{stats.users}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-sm text-gray-500">Verifikasi Pending</p>
            <p className="text-3xl font-bold text-yellow-500">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-sm text-gray-500">Total Transaksi</p>
            <p className="text-3xl font-bold text-blue-600">{stats.transactions}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-sm text-gray-500">Total Poin Beredar</p>
            <p className="text-3xl font-bold text-purple-600">{Number(stats.totalPoints).toLocaleString()}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {["overview", "verifikasi", "transaksi"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${tab === t ? "bg-green-600 text-white" : "bg-white text-gray-600 border"}`}
            >
              {t === "verifikasi" ? `Verifikasi Collector (${stats.pending})` : t === "transaksi" ? "Semua Transaksi" : "Overview"}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Memuat...</div>
          ) : tab === "verifikasi" ? (
            pendingCollectors.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">?</p>
                <p className="font-medium">Tidak ada collector pending</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingCollectors.map((c: any) => (
                  <div key={c.id} className="border rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-800">{c.fullName}</p>
                      <p className="text-sm text-gray-500">{c.email}</p>
                      <p className="text-xs text-gray-400">{c.phone}</p>
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full mt-1 inline-block">Pending Verifikasi</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => verifyCollector(c.id, "APPROVED")}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        Setujui
                      </button>
                      <button
                        onClick={() => verifyCollector(c.id, "REJECTED")}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : tab === "transaksi" ? (
            <div className="space-y-3">
              {recentRequests.map((req: any) => {
                const types = JSON.parse(req.sampahTypes || "[]")
                return (
                  <div key={req.id} className="border rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <div className="flex gap-1 mb-1">
                        {types.map((t: string) => (
                          <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{t}</span>
                        ))}
                      </div>
                      <p className="text-sm font-medium text-gray-800">{req.addressDetail}</p>
                      <p className="text-xs text-gray-500">Dari: {req.householdName}</p>
                      {req.actualWeight && <p className="text-xs text-gray-400">Berat: {req.actualWeight} kg</p>}
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLOR[req.status] || "bg-gray-100 text-gray-600"}`}>
                      {req.status}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-xl p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Status Transaksi</p>
                {["OPEN", "ASSIGNED", "COMPLETED", "CANCELLED"].map((s) => {
                  const count = recentRequests.filter(r => r.status === s).length
                  return (
                    <div key={s} className="flex justify-between items-center py-1.5 border-b last:border-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[s] || "bg-gray-100"}`}>{s}</span>
                      <span className="font-semibold text-gray-800">{count}</span>
                    </div>
                  )
                })}
              </div>
              <div className="border rounded-xl p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Aktivitas Platform</p>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Request</span>
                    <span className="font-semibold">{recentRequests.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Selesai</span>
                    <span className="font-semibold text-green-600">{recentRequests.filter(r => r.status === "COMPLETED").length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Poin Beredar</span>
                    <span className="font-semibold text-purple-600">{Number(stats.totalPoints).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
