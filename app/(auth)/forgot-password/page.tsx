"use client"

import BrandLogo from "@/components/BrandLogo"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { FormEvent, useState } from "react"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [mock, setMock] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (resetError) {
      if (resetError.message === "Konfigurasi Supabase belum tersedia.") {
        setMock(true)
        setSent(true)
        setLoading(false)
        return
      }
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <main className="auth-simple-page">
      <section className="auth-simple-card">
        <BrandLogo href="/login" compact />

        {sent ? (
          <>
            <div className="auth-success-mark">OK</div>
            <h1>Email terkirim</h1>
            <p>{mock ? <>Mode demo aktif. Permintaan reset untuk <strong>{email}</strong> sudah dicatat, tetapi email belum dikirim karena layanan email belum dikonfigurasi.</> : <>Cek email <strong>{email}</strong> dan buka link untuk membuat password baru.</>}</p>
            <Link href="/login" className="secondary-link-btn">Kembali ke Login</Link>
          </>
        ) : (
          <>
            <span className="section-kicker">Keamanan akun</span>
            <h1>Lupa password?</h1>
            <p>Masukkan email akunmu. Kami akan mengirimkan link untuk mengatur ulang password.</p>

            {error && <div className="form-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <label className="form-field">
                <span>Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nama@email.com"
                />
              </label>
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? "Mengirim..." : "Kirim Link Reset"}
              </button>
            </form>

            <Link href="/login" className="secondary-link-btn">Kembali ke Login</Link>
          </>
        )}
      </section>
    </main>
  )
}
