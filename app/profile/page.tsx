"use client"

import Navbar from "@/components/Navbar"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { getDashboardPath } from "@/lib/roles"

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
  const role = String(session?.user?.role || "")
  const roleAction: Record<string, string> = {
    HOUSEHOLD: "Buat Request Angkut Sampah",
    COLLECTOR: "Lihat Request Tersedia",
    RECYCLER: "Cari Batch Material",
    ADMIN: "Buka Dashboard Admin",
  }
  const roleActionPath = role === "HOUSEHOLD" ? "/household/request/new" : getDashboardPath(role)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  if (status !== "authenticated") return <div className="page-loader">Memuat profil...</div>

  return (
    <main className="app-page">
      <Navbar userName={session?.user?.name || ""} role={role} />

      <section className="content-shell">
        <div className="page-heading">
          <span className="section-kicker">Profil pengguna</span>
          <h1>Akun Saya</h1>
          <p>Kelola informasi dasar dan keamanan akun CuanSampah.</p>
          <button className="green-small-btn profile-role-cta" type="button" onClick={() => router.push(roleActionPath)}>
            {roleAction[role] || "Kembali ke Dashboard"}
          </button>
        </div>

        <section className="profile-grid">
          <article className="content-card">
            <div className="card-heading">
              <div>
                <h2>Informasi Akun</h2>
                <p>Data utama yang terhubung dengan akunmu.</p>
              </div>
              <button className="outline-btn" type="button" disabled title="Endpoint edit profil belum tersedia">Edit Profil - Segera Hadir</button>
            </div>
            <ProfileRow label="Nama" value={session?.user?.name} />
            <ProfileRow label="Email" value={session?.user?.email} />
            <ProfileRow label="Role" value={ROLE_LABEL[role] || role} />
            <ProfileRow label="Status Akun" value="Aktif - session terautentikasi" />
          </article>

          <article className="content-card">
            <div className="card-heading">
              <div>
                <h2>Data Kontak</h2>
                <p>Data kontak tambahan belum tersedia di session.</p>
              </div>
              <button className="outline-btn" type="button" disabled title="Endpoint profil belum tersedia">Edit - Segera Hadir</button>
            </div>
            <ProfileRow label="Nomor HP" />
            <ProfileRow label="Alamat" />
            <p className="card-note">Alamat penjemputan tetap dapat diisi ketika membuat request baru.</p>
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
              Ubah Password
            </button>
            <button className="outline-btn danger-outline-btn" type="button" onClick={() => void signOut({ callbackUrl: "/login" })}>Logout</button>
          </article>
        </section>
      </section>
    </main>
  )
}
