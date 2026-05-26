"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const ROLES = [
  { value: "HOUSEHOLD", icon: "??", label: "Rumah Tangga", desc: "Saya ingin menjual sampah terpilah & dapat cuan" },
  { value: "COLLECTOR", icon: "??", label: "Pengepul Sampah", desc: "Saya mengumpulkan & mendistribusikan sampah" },
  { value: "RECYCLER",  icon: "??", label: "Industri Daur Ulang", desc: "Saya membeli material untuk diolah kembali" },
]

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "", role: "HOUSEHOLD" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-white py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: "#16a34a" }}>CS</div>
          <span className="text-xl font-bold" style={{ color: "#15803d" }}>CuanSampah</span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Buat akun baru</h1>
          <p className="text-sm text-gray-500">Bergabung & mulai hasilkan cuan dari sampah</p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="text-sm p-3 rounded-lg bg-red-50 text-red-600 border border-red-100">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Daftar sebagai</label>
              <div className="space-y-2">
                {ROLES.map(r => (
                  <label key={r.value} className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer border-2 transition-all"
                    style={{ borderColor: form.role === r.value ? "#16a34a" : "#e5e7eb", background: form.role === r.value ? "#f0fdf4" : "#fff" }}>
                    <input type="radio" name="role" value={r.value} checked={form.role === r.value}
                      onChange={e => setForm({ ...form, role: e.target.value })} className="hidden" />
                    <span className="text-xl">{r.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{r.label}</p>
                      <p className="text-xs text-gray-500">{r.desc}</p>
                    </div>
                    {form.role === r.value && <span className="text-green-600 text-lg">?</span>}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
                <input type="text" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="John Doe" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Telepon</label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="08xx" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="email@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Min. 8 karakter" required />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              style={{ background: "#16a34a" }}>
              {loading ? "Mendaftar..." : "Daftar Sekarang ¡ú"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Sudah punya akun? <Link href="/login" className="font-semibold" style={{ color: "#16a34a" }}>Masuk di sini</Link>
        </p>
      </div>
    </div>
  )
}
