"use client"

import Navbar from "@/components/Navbar"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"
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
  const role = String(session?.user?.role || "").toUpperCase()
  const roleAction: Record<string, string> = {
    HOUSEHOLD: "Buat Permintaan Penjemputan",
    COLLECTOR: "Lihat Permintaan Tersedia",
    RECYCLER: "Cari Batch Material",
    ADMIN: "Buka Dashboard Admin",
  }
  const roleActionPath = role === "HOUSEHOLD" ? "/household/request/new" : getDashboardPath(role)
  const [profile, setProfile] = useState({ fullName: "", email: "", phone: "", address: "", isVerified: false })
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/profile")
      .then((response) => response.json())
      .then((data) => setProfile({
        fullName: data.profile?.fullName || session.user.name || "",
        email: data.profile?.email || session.user.email || "",
        phone: data.profile?.phone || "",
        address: data.profile?.address || "",
        isVerified: Boolean(data.profile?.isVerified),
      }))
      .catch(() => setNotice("Profil tambahan belum dapat dimuat."))
  }, [status, session])

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice("")
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    })
    const data = await response.json()
    if (!response.ok) return setNotice(data.error || "Profil gagal diperbarui.")
    if (data.emailChanged) {
      await signOut({ callbackUrl: "/login" })
      return
    }
    setEditing(false)
    setNotice("Profil berhasil diperbarui.")
  }

  if (status !== "authenticated") return <div className="page-loader">Memuat profil...</div>

  return (
    <main className="app-page">
      <Navbar userName={session?.user?.name || ""} role={role} />

      <section className="content-shell">
        <div className="page-heading">
          <span className="section-kicker">Profil pengguna</span>
          <h1>Akun Saya</h1>
          <p>Kelola informasi dasar dan keamanan akun CuanSampah.</p>
          {notice && <p className="card-note">{notice}</p>}
          <button className="green-small-btn profile-role-cta" type="button" onClick={() => router.push(roleActionPath)}>
            {roleAction[role] || "Kembali ke Dashboard"}
          </button>
        </div>

        <section className="profile-grid">
          <article className="content-card">
            <div className="card-heading">
              <div>
                <div className="profile-avatar" aria-label="Avatar placeholder">{(profile.fullName || session.user.name || "CS").slice(0, 2).toUpperCase()}</div>
                <h2>Informasi Akun</h2>
                <p>Data utama yang terhubung dengan akunmu.</p>
              </div>
              <button className="outline-btn" type="button" onClick={() => setEditing(!editing)}>{editing ? "Batal" : "Edit Profil"}</button>
            </div>
            {editing ? (
              <form onSubmit={saveProfile}>
                <label className="form-field"><span>Nama</span><input value={profile.fullName} onChange={(event) => setProfile({ ...profile, fullName: event.target.value })} required /></label>
                <label className="form-field"><span>Email</span><input type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} required /></label>
                <label className="form-field"><span>Nomor HP</span><input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label>
                <label className="form-field"><span>Alamat</span><input value={profile.address} onChange={(event) => setProfile({ ...profile, address: event.target.value })} /></label>
                <button className="green-small-btn" type="submit">Simpan Profil</button>
              </form>
            ) : (
              <>
                <ProfileRow label="Nama" value={profile.fullName || session?.user?.name} />
                <ProfileRow label="Email" value={profile.email || session?.user?.email} />
              </>
            )}
            <ProfileRow label="Peran" value={ROLE_LABEL[role] || role} />
            <ProfileRow label="Status Akun" value={profile.isVerified ? "Terverifikasi" : "Aktif"} />
          </article>

          <article className="content-card">
            <div className="card-heading">
              <div>
                <h2>Data Kontak</h2>
                <p>Kontak yang digunakan untuk koordinasi layanan.</p>
              </div>
            </div>
            <ProfileRow label="Nomor HP" value={profile.phone} />
            <ProfileRow label="Alamat" value={profile.address} />
            <p className="card-note">Alamat penjemputan tetap bisa diisi kembali saat membuat permintaan baru.</p>
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
              Ubah Kata Sandi
            </button>
            <button className="outline-btn danger-outline-btn" type="button" onClick={() => void signOut({ callbackUrl: "/login" })}>Logout</button>
          </article>
        </section>
      </section>
    </main>
  )
}
