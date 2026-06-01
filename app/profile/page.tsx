"use client"

import Navbar from "@/components/Navbar"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const ROLE_LABEL: Record<string, string> = {
  HOUSEHOLD: "Rumah Tangga",
  COLLECTOR: "Pengepul",
  RECYCLER: "Recycler",
  ADMIN: "Admin",
}

function ProfileRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="profile-row">
      <span>{label}</span>
      <strong className={value ? "" : "muted-value"}>{value || "Belum diisi"}</strong>
    </div>
  )
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const role = session?.user?.role || ""

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  if (status === "loading") return <div className="page-loader">Memuat profil...</div>

  return (
    <main className="app-page">
      <Navbar userName={session?.user?.name || ""} role={role} />

      <section className="content-shell">
        <div className="page-heading">
          <span className="section-kicker">Profil pengguna</span>
          <h1>Akun Saya</h1>
          <p>Kelola informasi dasar dan keamanan akun CuanSampah.</p>
        </div>

        <section className="profile-grid">
          <article className="content-card">
            <div className="card-heading">
              <div>
                <h2>Informasi Akun</h2>
                <p>Data utama yang terhubung dengan akunmu.</p>
              </div>
              <button className="outline-btn" type="button">Edit Profil</button>
            </div>
            <ProfileRow label="Nama" value={session?.user?.name} />
            <ProfileRow label="Email" value={session?.user?.email} />
            <ProfileRow label="Role" value={ROLE_LABEL[role] || role} />
            <ProfileRow label="Nomor HP" />
          </article>

          <article className="content-card">
            <div className="card-heading">
              <div>
                <h2>Alamat Penjemputan</h2>
                <p>Alamat utama untuk layanan angkut sampah gratis.</p>
              </div>
              <button className="outline-btn" type="button">Ubah Alamat</button>
            </div>
            <ProfileRow label="Alamat" />
            <p className="card-note">Alamat dapat diisi saat membuat request penjemputan.</p>
          </article>

          <article className="content-card">
            <div className="card-heading">
              <div>
                <h2>Keamanan</h2>
                <p>Pastikan akunmu tetap aman.</p>
              </div>
            </div>
            <ProfileRow label="Password" value="Tersimpan dengan aman" />
            <button className="outline-btn" type="button" onClick={() => router.push("/forgot-password")}>
              Atur Ulang Password
            </button>
          </article>
        </section>
      </section>
    </main>
  )
}
