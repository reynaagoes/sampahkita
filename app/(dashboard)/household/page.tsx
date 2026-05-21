"use client"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Menunggu Pengepul", color: "bg-yellow-100 text-yellow-700" },
  ASSIGNED: { label: "Pengepul Menuju Lokasi", color: "bg-blue-100 text-blue-700" },
  PICKED_UP: { label: "Sedang Diproses", color: "bg-purple-100 text-purple-700" },
  COMPLETED: { label: "Selesai", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Dibatalkan", color: "bg-red-100 text-red-700" },
}

export default function HouseholdDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<any[]>([])
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/requests")
        .then((r) => r.json())
        .then((data) => {
          setRequests(data.requests || [])
          setLoading(false)
        })
      fetch("/api/points")
        .then((r) => r.json())
        .then((data) => setPoints(data.total || 0))
    }
  }, [status])

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  const activeCount = requests.filter((r) => ["OPEN", "ASSIGNED", "PICKED_UP"].includes(r.status)).length
  const completedCount = requests.filter((r) => r.status === "COMPLETED").length

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <span className="text-2xl font-bold text-green-700">SampahKita</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Halo, {session?.user?.name}</span>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-sm text-red-500 hover:text-red-700">Keluar</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <p className="text-sm text-gray-500">Total Poin</p>
            <p className="text-3xl font-bold text-green-600">{points.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">poin terkumpul</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <p className="text-sm text-gray-500">Request Aktif</p>
            <p className="text-3xl font-bold text-blue-600">{activeCount}</p>
            <p className="text-xs text-gray-400 mt-1">menunggu pengepul</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <p className="text-sm text-gray-500">Total Selesai</p>
            <p className="text-3xl font-bold text-gray-600">{completedCount}</p>
            <p className="text-xs text-gray-400 mt-1">pengambilan sampah</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Request Sampah Saya</h2>
            <button
              onClick={() => router.push("/household/request/new")}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              + Buat Request
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Memuat...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">?</p>
              <p className="font-medium">Belum ada request</p>
              <p className="text-sm">Klik tombol di atas untuk membuat request pertama</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req: any) => {
                const types = JSON.parse(req.sampahTypes || "[]")
                const statusInfo = STATUS_LABEL[req.status] || STATUS_LABEL.OPEN
                return (
                  <div key={req.id} className="border rounded-xl p-4 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex gap-2 flex-wrap mb-1">
                          {types.map((t: string) => (
                            <span key={t} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full capitalize">{t}</span>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600">{req.addressDetail}</p>
                        {req.estimatedWeight && (
                          <p className="text-xs text-gray-400 mt-1">Estimasi: {req.estimatedWeight} kg</p>
                        )}
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
