"use client"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

const SAMPAH_TYPES = [
  { id: "plastik", label: "Plastik", poin: 500 },
  { id: "kertas", label: "Kertas", poin: 300 },
  { id: "logam", label: "Logam/Besi", poin: 800 },
  { id: "kaca", label: "Kaca", poin: 400 },
  { id: "elektronik", label: "Elektronik", poin: 1000 },
]

export default function NewRequestPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [form, setForm] = useState({
    estimatedWeight: "",
    addressDetail: "",
    notes: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function toggleType(id: string) {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedTypes.length === 0) {
      setError("Pilih minimal satu jenis sampah")
      return
    }
    setLoading(true)
    setError("")

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sampahTypes: JSON.stringify(selectedTypes),
        estimatedWeight: parseFloat(form.estimatedWeight) || null,
        addressDetail: form.addressDetail,
        notes: form.notes,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "Terjadi kesalahan")
      setLoading(false)
      return
    }

    router.push("/household")
  }

  const estimatedPoints = selectedTypes.reduce((total, type) => {
    const found = SAMPAH_TYPES.find((t) => t.id === type)
    return total + (found?.poin || 0)
  }, 0) * (parseFloat(form.estimatedWeight) || 1)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          &larr; Kembali
        </button>
        <span className="text-xl font-bold text-green-700">Buat Request Sampah</span>
      </nav>

      <div className="max-w-2xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
          )}

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Jenis Sampah</h2>
            <div className="grid grid-cols-2 gap-3">
              {SAMPAH_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => toggleType(type.id)}
                  className={`p-4 rounded-xl border-2 text-left transition ${
                    selectedTypes.includes(type.id)
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-medium text-gray-800">{type.label}</p>
                  <p className="text-xs text-green-600">{type.poin} poin/kg</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Detail Sampah</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimasi Berat (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={form.estimatedWeight}
                onChange={(e) => setForm({ ...form, estimatedWeight: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Contoh: 2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alamat Detail
              </label>
              <textarea
                value={form.addressDetail}
                onChange={(e) => setForm({ ...form, addressDetail: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Contoh: Jl. Merdeka No. 10, RT 03/RW 05"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catatan (opsional)
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Contoh: Sampah ada di depan pagar"
                rows={2}
              />
            </div>
          </div>

          {selectedTypes.length > 0 && form.estimatedWeight && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-700">Estimasi poin yang kamu dapatkan:</p>
              <p className="text-2xl font-bold text-green-600">{Math.round(estimatedPoints).toLocaleString()} poin</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? "Mengirim..." : "Kirim Request"}
          </button>
        </form>
      </div>
    </div>
  )
}
