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
      setError("Email atau kata sandi salah")
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
          <a href="#cara-kerja">Cara Kerja</a>
          <a href="#manfaat">Manfaat</a>
          <a href="#pasarcuan">PasarCuan</a>
          <a href="#tentang-kami">Tentang Kami</a>
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
            Jadwalkan penjemputan sampah gratis dari rumah dengan proses yang mudah,
            teratur, dan berdampak baik bagi lingkungan.
          </p>

          <div className="login-feature-list">
            <div className="login-feature-card">
              <span className="feature-dot" />
              <div>
                <strong>Angkut sampah gratis</strong>
                <small>Pilih jadwal, lalu kami jemput langsung dari rumah.</small>
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
            <span>Kata sandi</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan kata sandi"
              required
            />
          </label>

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? "Memverifikasi..." : "Masuk"}
          </button>

          <div className="login-mini-links">
            <Link href="/forgot-password">Lupa kata sandi?</Link>
            <Link href="/register">Buat akun</Link>
          </div>
        </form>
      </section>

      <section id="layanan" className="login-info-section">
        <span className="section-kicker">Layanan</span>
        <h2>Ajukan penjemputan sampah gratis dari rumah.</h2>
        <p>Rumah tangga membuat permintaan, pengepul menjemput sampah, berat aktual divalidasi, lalu poin masuk otomatis.</p>
      </section>

      <section id="cara-kerja" className="login-info-section">
        <span className="section-kicker">Cara Kerja</span>
        <h2>Alur sederhana tanpa chat real-time.</h2>
        <p>Rumah tangga membuat permintaan, pengepul menjalankan pickup bertahap, material masuk inventori, lalu recycler membeli batch material.</p>
      </section>

      <section id="manfaat" className="login-info-section">
        <span className="section-kicker">Manfaat</span>
        <h2>Poin, badge, dan reward untuk kontribusi rutin.</h2>
        <p>Setiap pickup selesai memberi poin sesuai jenis dan berat sampah yang tervalidasi.</p>
      </section>

      <section id="pasarcuan" className="login-info-section">
        <span className="section-kicker">PasarCuan</span>
        <h2>Fitur pendukung untuk barang layak pakai.</h2>
        <p>PasarCuan membantu pengguna menjual barang yang masih bernilai, sementara layanan utama tetap penjemputan sampah gratis.</p>
      </section>

      <section id="tentang-kami" className="login-info-section">
        <span className="section-kicker">Tentang Kami</span>
        <h2>Platform ekonomi sirkular CuanSampah.</h2>
        <p>CuanSampah menghubungkan rumah tangga, pengepul, dan recycler agar sampah dapat dikelola menjadi material bernilai.</p>
      </section>
    </main>
  )
}
