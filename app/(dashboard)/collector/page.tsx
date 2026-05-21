"use client"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

function PickupCard({ req, onComplete }: { req: any; onComplete: (id: string, weight: string) => void }) {
  const [weight, setWeight] = useState("")
  const types = JSON.parse(req.sampahTypes || "[]")

  return (
    <div className="border rounded-xl p-4">
      <div className="flex gap-2 flex-wrap mb-2">
        {types.map((t: string) => (
          <span key={t} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">{t}</span>
        ))}
      </div>
      <p className="text-sm font-medium text-gray-800 mb-1">{req.addressDetail}</p>
      <p className="text-xs text-gray-500 mb-3">Dari: {req.householdName}</p>
      {req.status !== "COMPLETED" ? (
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Berat aktual (kg)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={() => onComplete(req.id, weight)}
            disabled={!weight}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Selesaikan
          </button>
        </div>
      ) : (
        <p className="text-sm text-green-600 font-medium">Selesai - {req.actualWeight} kg</p>
      )}
    </div>
  )
}

export default function CollectorDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<any[]>([])
  const [myPickups, setMyPickups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"available" | "mypickups">("available")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") fetchData()
  }, [status])

  async function fetchData() {
    setLoading(true)
    const [avail, mine] = await Promise.all([
      fetch("/api/requests/available").then((r) => r.json()),
      fetch("/api/requests/my-pickups").then((r) => r.json()),
    ])
    setRequests(avail.requests || [])
    setMyPickups(mine.requests || [])
    setLoading(false)
  }

  async function acceptRequest(requestId: string) {
    const res = await fetch(`/api/requests/${requestId}/accept`, { method: "POST" })
    if (res.ok) fetchData()
  }

  async function completeRequest(requestId: string, weight: string) {
    if (!weight) return
    const res = await fetch(`/api/requests/${requestId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actualWeight: parseFloat(weight) }),
    })
    if (res.ok) {
      const data = await res.json()
      alert(`Selesai! Household mendapat ${data.pointsEarned} poin`)
      fetchData()
    }
  }

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center">Loading...</div>

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
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <p className="text-sm text-gray-500">Request Tersedia</p>
            <p className="text-3xl font-bold text-green-600">{requests.length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <p className="text-sm text-gray-500">Sedang Diproses</p>
            <p className="text-3xl font-bold text-blue-600">{myPickups.filter(r => r.status !== "COMPLETED").length}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("available")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "available" ? "bg-green-600 text-white" : "bg-white text-gray-600 border"}`}
          >
            Request Tersedia ({requests.length})
          </button>
          <button
            onClick={() => setTab("mypickups")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "mypickups" ? "bg-green-600 text-white" : "bg-white text-gray-600 border"}`}
          >
            Pickup Saya ({myPickups.length})
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Memuat...</div>
          ) : tab === "available" ? (
            requests.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">?</p>
                <p className="font-medium">Tidak ada request tersedia</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req: any) => {
                  const types = JSON.parse(req.sampahTypes || "[]")
                  return (
                    <div key={req.id} className="border rounded-xl p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex gap-2 flex-wrap mb-1">
                            {types.map((t: string) => (
                              <span key={t} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full capitalize">{t}</span>
                            ))}
                          </div>
                          <p className="text-sm font-medium text-gray-800">{req.addressDetail}</p>
                          <p className="text-xs text-gray-500">Dari: {req.householdName}</p>
                          {req.estimatedWeight && <p className="text-xs text-gray-400">Estimasi: {req.estimatedWeight} kg</p>}
                          {req.notes && <p className="text-xs text-gray-400">Catatan: {req.notes}</p>}
                        </div>
                        <button
                          onClick={() => acceptRequest(req.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ml-4"
                        >
                          Ambil Request
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            myPickups.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>Belum ada pickup</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myPickups.map((req: any) => (
                  <PickupCard key={req.id} req={req} onComplete={completeRequest} />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
