"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await signIn("credentials", { email, password, redirect: false })
    if (res?.error) { setError("Email atau password salah"); setLoading(false); return }
    const session = await fetch("/api/auth/session").then(r => r.json())
    const role = session?.user?.role
    if (role === "HOUSEHOLD") router.push("/household")
    else if (role === "COLLECTOR") router.push("/collector")
    else if (role === "RECYCLER") router.push("/recycler")
    else if (role === "ADMIN") router.push("/admin")
    else router.push("/")
  }
  return (
    <div className="min-h-screen bg-white flex">
      <div className="hidden lg:flex flex-col justify-between w-5/12 p-12" style={{background:"#f0fdf4"}}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold" style={{background:"#16a34a"}}>CS</div>
          <span className="text-xl font-bold" style={{color:"#15803d"}}>CuanSampah</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold leading-snug mb-4" style={{color:"#14532d"}}>Sampahmu,<br/>Cuanmu.</h1>
          <p className="text-sm leading-relaxed mb-6" style={{color:"#166534"}}>Platform ekonomi sirkular yang menghubungkan rumah tangga, pengepul, dan industri daur ulang.</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-white rounded-xl p-3" style={{border:"1px solid #bbf7d0"}}>
              <div className="w-7 h-7 rounded-lg text-white text-xs font-bold flex items-center justify-center" style={{background:"#16a34a"}}>H</div>
              <div><p className="text-sm font-semibold" style={{color:"#14532d"}}>Rumah Tangga</p><p className="text-xs" style={{color:"#166534"}}>Jual sampah, kumpulkan poin</p></div>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-xl p-3" style={{border:"1px solid #bbf7d0"}}>
              <div className="w-7 h-7 rounded-lg text-white text-xs font-bold flex items-center justify-center" style={{background:"#16a34a"}}>C</div>
              <div><p className="text-sm font-semibold" style={{color:"#14532d"}}>Pengepul</p><p className="text-xs" style={{color:"#166534"}}>Temukan request di sekitarmu</p></div>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-xl p-3" style={{border:"1px solid #bbf7d0"}}>
              <div className="w-7 h-7 rounded-lg text-white text-xs font-bold flex items-center justify-center" style={{background:"#16a34a"}}>R</div>
              <div><p className="text-sm font-semibold" style={{color:"#14532d"}}>Recycler</p><p className="text-xs" style={{color:"#166534"}}>Beli batch material berkualitas</p></div>
            </div>
          </div>
        </div>
        <p className="text-xs" style={{color:"#86efac"}}>CuanSampah 2026 - II2210 Teknologi Platform ITB</p>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-1 text-gray-900">Masuk ke akun</h2>
          <p className="text-sm text-gray-500 mb-7">Belum punya akun? <a href="/register" className="font-semibold" style={{color:"#16a34a"}}>Daftar gratis</a></p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-sm p-3 rounded-lg bg-red-50 text-red-600">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none" placeholder="nama@email.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none" placeholder="Min. 8 karakter" required />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-semibold text-white" style={{background:"#16a34a"}}>
              {loading ? "Memverifikasi..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}