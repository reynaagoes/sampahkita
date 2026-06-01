"use client"

import Navbar from "@/components/Navbar"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const EARNING_STEPS = [
  ["01", "Request selesai", "Poin masuk setelah proses penjemputan dinyatakan selesai."],
  ["02", "Berat sampah tervalidasi", "Jumlah poin menyesuaikan berat aktual yang dicatat pengepul."],
  ["03", "Sampah terpilah rapi", "Pisahkan material agar proses validasi lebih cepat dan bernilai."],
  ["04", "Transaksi PasarCuan", "Barang layak pakai dapat memberi nilai tambahan melalui PasarCuan."],
]

const REWARDS = [
  { name: "Voucher Rp5.000", points: 5000, description: "Voucher hemat untuk kebutuhan harian." },
  { name: "Voucher Rp10.000", points: 9000, description: "Reward untuk kontribusi rutinmu." },
  { name: "Badge Eco Hero", points: 12000, description: "Badge khusus pengguna peduli lingkungan." },
]

export default function PointsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const role = String(session?.user?.role || "")
  const dashboardPath =
    role === "COLLECTOR"
      ? "/collector"
      : role === "RECYCLER"
        ? "/recycler"
        : role === "ADMIN"
          ? "/admin"
          : "/household/request/new"

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/points")
      .then((response) => response.json())
      .then((data) => setPoints(Number(data.total) || 0))
      .catch(() => setPoints(0))
      .finally(() => setLoading(false))
  }, [status])

  if (status === "loading" || loading) return <div className="page-loader">Memuat poin...</div>

  return (
    <main className="app-page">
      <Navbar userName={session?.user?.name || ""} role={session?.user?.role} />

      <section className="content-shell">
        <div className="points-hero">
          <div>
            <span className="section-kicker">Poin Saya</span>
            <h1>{points.toLocaleString("id-ID")} <small>poin</small></h1>
            <p>Kumpulkan poin dari sampah yang tervalidasi dan tukarkan dengan reward.</p>
          </div>
          <button className="light-btn" type="button" onClick={() => router.push(dashboardPath)}>
            {role === "HOUSEHOLD" ? "Buat Request Angkut" : "Kembali ke Dashboard"}
          </button>
        </div>

        <section className="content-section">
          <div className="section-heading">
            <h2>Cara Mendapatkan Poin</h2>
            <p>Poin mengikuti kontribusi yang tercatat di CuanSampah.</p>
          </div>
          <div className="earning-grid">
            {EARNING_STEPS.map(([number, title, description]) => (
              <article className="earning-card" key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <h2>Katalog Reward</h2>
            <p>Penukaran reward masih berupa tampilan awal dan belum memotong poin.</p>
          </div>
          <div className="reward-grid">
            {REWARDS.map((reward) => (
              <article className="reward-card" key={reward.name}>
                <span className="reward-label">Reward</span>
                <h3>{reward.name}</h3>
                <p>{reward.description}</p>
                <div>
                  <strong>{reward.points.toLocaleString("id-ID")} poin</strong>
                  <button className="outline-btn" type="button" disabled={points < reward.points}>Tukar</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="content-card points-history">
          <div className="section-heading">
            <h2>Riwayat Poin</h2>
            <p>Aktivitas poin terbaru akan tampil di sini.</p>
          </div>
          <div className="empty-state">
            <div className="empty-icon">+</div>
            <h3>Riwayat detail belum tersedia</h3>
            <p>Total poin tetap dihitung dari aktivitas yang sudah tervalidasi.</p>
          </div>
        </section>
      </section>
    </main>
  )
}
