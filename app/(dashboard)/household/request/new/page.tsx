"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import { useSession } from "next-auth/react"

const WASTE_TYPES = [
  { id: "plastik",    label: "Plastik",    poin: 500,  desc: "Botol, kantong, wadah" },
  { id: "kertas",     label: "Kertas",     poin: 300,  desc: "Koran, kardus, buku" },
  { id: "logam",      label: "Logam",      poin: 800,  desc: "Kaleng, besi, tembaga" },
  { id: "kaca",       label: "Kaca",       poin: 400,  desc: "Botol kaca, cermin" },
  { id: "elektronik", label: "Elektronik", poin: 1000, desc: "HP, kabel, baterai" },
]

export default function NewRequestPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [form, setForm] = useState({ estimatedWeight: "", addressDetail: "", notes: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function toggleType(id: string) {
    setSelectedTypes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedTypes.length === 0) { setError("Pilih minimal satu jenis sampah"); return }
    setLoading(true)
    setError("")
    const res = await fetch("/api/requests", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sampahTypes: JSON.stringify(selectedTypes), estimatedWeight: parseFloat(form.estimatedWeight) || null, addressDetail: form.addressDetail, notes: form.notes }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || "Terjadi kesalahan"); setLoading(false); return }
    router.push("/household")
  }

  const estPoints = selectedTypes.reduce((sum, t) => {
    const found = WASTE_TYPES.find(w => w.id === t)
    return sum + (found?.poin || 0)
  }, 0) * (parseFloat(form.estimatedWeight) || 1)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session?.user?.name || ""} role="HOUSEHOLD" />
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 transition">¡û Kembali</button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Buat Request Sampah</h1>
            <p className="text-xs text-gray-400">Isi detail sampah yang ingin dijemput</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm p-3 rounded-lg bg-red-50 text-red-600 border border-red-100">{error}</div>}

          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Jenis Sampah</h2>
            <div className="grid grid-cols-2 gap-2">
              {WASTE_TYPES.map(type => (
                <button key={type.id} type="button" onClick={() => toggleType(type.id)}
                  className="p-3.5 rounded-xl border-2 text-left transition-all"
                  style={{ borderColor: selectedTypes.includes(type.id) ? "#16a34a" : "#e5e7eb", background: selectedTypes.includes(type.id) ? "#f0fdf4" : "#fff" }}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-semibold text-gray-800">{type.label}</span>
                    {selectedTypes.includes(type.id) && <span className="text-green-600 text-sm">?</span>}
                  </div>
                  <p className="text-xs text-gray-400">{type.desc}</p>
                  <p className="text-xs font-medium mt-1.5" style={{ color: "#16a34a" }}>{type.poin.toLocaleString()} poin/kg</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Detail Penjemputan</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Estimasi Berat (kg)</label>
              <input type="number" step="0.1" min="0.1" value={form.estimatedWeight}
                onChange={e => setForm({ ...form, estimatedWeight: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Contoh: 2.5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat Penjemputan</label>
              <textarea value={form.addressDetail} onChange={e => setForm({ ...form, addressDetail: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Contoh: Jl. Merdeka No. 10, RT 03/RW 05" rows={3} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan (opsional)</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Contoh: Sampah ada di depan pagar" rows={2} />
            </div>
          </div>

          {selectedTypes.length > 0 && form.estimatedWeight && (
            <div className="rounded-xl p-4 flex justify-between items-center" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <div>
                <p className="text-xs font-semibold" style={{ color: "#16a34a" }}>Estimasi poin yang kamu dapatkan</p>
                <p className="text-2xl font-bold" style={{ color: "#14532d" }}>{Math.round(estPoints).toLocaleString("id-ID")} poin</p>
              </div>
              <span className="text-3xl">??</span>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ background: "#16a34a" }}>
            {loading ? "Mengirim request..." : "Kirim Request ¡ú"}
          </button>
        </form>
      </div>
    </div>
  )
}
