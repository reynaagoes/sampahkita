"use client"

import BrandLogo from "@/components/BrandLogo"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")

    const res = await signIn("credentials", { email, password, redirect: false })

    if (res?.error) {
      setError("Email atau password salah")
      setLoading(false)
      return
    }

    const session = await fetch("/api/auth/session").then((response) => response.json())
    const role = session?.user?.role

    if (role === "HOUSEHOLD") router.push("/household")
    else if (role === "COLLECTOR") router.push("/collector")
    else if (role === "RECYCLER") router.push("/recycler")
    else if (role === "ADMIN") router.push("/admin")
    else router.push("/")
  }

  return (
    <main className="login-page">
      <nav className="login-nav">
        <BrandLogo href="/login" dark />
        <div className="login-nav-links">
          <a href="#layanan">Layanan</a>
          <a href="#manfaat">Manfaat</a>
          <Link href="/register" className="login-register-link">Daftar Gratis</Link>
        </div>
      </nav>

      <section className="login-hero">
        <div className="login-copy">
          <span className="section-kicker">Layanan lingkungan untuk rumah tangga</span>
          <h1>
            Sampah terangkut,
            <span>rumah tetap nyaman.</span>
          </h1>
          <p>
            Jadwalkan penjemputan sampah gratis dari rumah. Kami membantu prosesnya
            tetap mudah, teratur, dan memberi dampak baik untuk lingkungan.
          </p>

          <div className="login-feature-list" id="layanan">
            <div className="login-feature-card">
              <span className="feature-dot" />
              <div>
                <strong>Angkut sampah gratis</strong>
                <small>Pilih jadwal, kami datang ke rumahmu.</small>
              </div>
            </div>
            <div className="login-feature-card">
              <span className="feature-dot" />
              <div>
                <strong>Kumpulkan poin</strong>
                <small>Dapatkan nilai dari sampah yang dijemput.</small>
              </div>
            </div>
          </div>

          <div className="login-secondary-note" id="manfaat">
            <strong>PasarCuan</strong>
            <span>Fitur tambahan untuk barang yang masih layak dan material daur ulang.</span>
          </div>
        </div>

        <form className="login-card" onSubmit={handleSubmit}>
          <BrandLogo href="/login" compact />
          <div className="login-card-head">
            <h2>Masuk ke CuanSampah</h2>
            <p>Belum punya akun? <Link href="/register">Daftar gratis</Link></p>
          </div>

          {error && <div className="form-error">{error}</div>}

          <label className="form-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@email.com"
              required
            />
          </label>

          <label className="form-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan password"
              required
            />
          </label>

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? "Memverifikasi..." : "Masuk"}
          </button>

          <div className="login-mini-links">
            <Link href="/forgot-password">Lupa password?</Link>
            <Link href="/register">Buat akun</Link>
          </div>
        </form>
      </section>
    </main>
  )
}
