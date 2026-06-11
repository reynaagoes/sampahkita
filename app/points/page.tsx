"use client"

import Navbar from "@/components/Navbar"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { REWARDS, WASTE_MATERIALS } from "@/lib/points"

const EARNING_STEPS = [
  ["01", "Permintaan selesai", "Poin masuk setelah proses penjemputan dinyatakan selesai."],
  ["02", "Berat sampah tervalidasi", "Jumlah poin menyesuaikan berat aktual yang dicatat pengepul."],
  ["03", "Sampah terpilah rapi", "Pisahkan material agar proses validasi lebih cepat dan bernilai."],
  ["04", "Transaksi PasarCuan", "Barang layak pakai dapat memberi nilai tambahan melalui PasarCuan."],
]

export default function PointsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<Array<{ id: string; amount: number; description?: string | null; createdAt: string }>>([])
  const [badges, setBadges] = useState<Array<{ id: string; badgeName: string; thresholdPoints: number }>>([])
  const [badgeProgress, setBadgeProgress] = useState<{ name: string; current: number; target: number; remaining: number } | null>(null)
  const [redemptions, setRedemptions] = useState<Array<{ id: string; rewardName: string; pointsCost: number; status: string; createdAt: string }>>([])
  const role = String(session?.user?.role || "").toUpperCase()
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
    if (status === "authenticated" && role !== "HOUSEHOLD") router.replace(role === "COLLECTOR" ? "/collector" : role === "RECYCLER" ? "/recycler" : "/admin")
  }, [status, role, router])

  useEffect(() => {
    if (status !== "authenticated" || role !== "HOUSEHOLD") return
    fetch("/api/points")
      .then((response) => response.json())
      .then((data) => {
        setPoints(Number(data.total) || 0)
        setHistory(data.history || [])
        setBadges(data.badges || [])
        setBadgeProgress(data.badgeProgress || null)
        setRedemptions(data.redemptions || [])
      })
      .catch(() => setPoints(0))
      .finally(() => setLoading(false))
  }, [status, role])

  if (status !== "authenticated" || role !== "HOUSEHOLD" || loading) return <div className="page-loader">Memuat poin...</div>

  async function redeem(rewardCode: string) {
    const response = await fetch("/api/rewards/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rewardCode }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) return alert(data.error || "Reward tidak dapat ditukar")
    alert("Reward berhasil ditukar.")
    window.location.reload()
  }

  return (
    <main className="app-page">
      <Navbar userName={session?.user?.name || ""} role={session?.user?.role} />

      <section className="content-shell">
        <div className="points-hero">
          <div>
            <span className="section-kicker">Poin Saya</span>
            <h1>{points.toLocaleString("id-ID")} <small>poin</small></h1>
            <p>Kumpulkan poin dari sampah yang tervalidasi lalu tukarkan dengan reward.</p>
          </div>
          <button className="light-btn" type="button" onClick={() => router.push(dashboardPath)}>
            {role === "HOUSEHOLD" ? "Buat Permintaan Angkut" : "Kembali ke Dashboard"}
          </button>
        </div>

        <section className="content-section">
          <div className="section-heading">
            <h2>Poin Digunakan untuk Apa?</h2>
            <p>Poin menjadi indikator dampak dan dapat digunakan untuk penukaran voucher, reward, serta badge kontribusi.</p>
          </div>
          <div className="points-purpose">
            <span>Reward</span><span>Voucher</span><span>Badge kontribusi</span><span>Indikator dampak</span>
          </div>
        </section>

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
          <div className="points-purpose point-rate-list">
            {WASTE_MATERIALS.map((item) => <span key={item.id}>{item.label} {item.points} poin/kg</span>)}
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <h2>Badge Saya</h2>
            <p>Badge diberikan otomatis berdasarkan total poin yang pernah diperoleh.</p>
          </div>
          {badges.length ? <div className="points-purpose">{badges.map((badge) => <span key={badge.id}>{badge.badgeName}</span>)}</div> : <div className="empty-state content-card"><h3>Belum ada badge</h3><p>Badge pertama, Eco Starter, terbuka saat total poin mencapai 100.</p></div>}
          {badgeProgress && <p className="card-note">{badgeProgress.current.toLocaleString("id-ID")} / {badgeProgress.target.toLocaleString("id-ID")} poin menuju {badgeProgress.name}. Sisa {badgeProgress.remaining.toLocaleString("id-ID")} poin.</p>}
          {!badgeProgress && <p className="card-note">Semua badge utama sudah terbuka.</p>}
        </section>

        <section className="content-section">
          <div className="section-heading">
            <h2>Katalog Reward</h2>
            <p>Reward dapat ditukar jika saldo poin mencukupi.</p>
          </div>
          <div className="reward-grid">
            {REWARDS.map((reward) => (
              <article className="reward-card" key={reward.name}>
                <span className="reward-label">Reward</span>
                <h3>{reward.name}</h3>
                <p>{reward.description}</p>
                <div>
                  <strong>{reward.points.toLocaleString("id-ID")} poin</strong>
                  <button className="outline-btn" type="button" disabled={points < reward.points} onClick={() => void redeem(reward.code)}>{points >= reward.points ? "Tukar Reward" : "Poin belum cukup"}</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="content-card points-history">
          <div className="section-heading">
            <h2>Riwayat Penukaran</h2>
            <p>Voucher yang ditukar akan tampil sebagai reward saya.</p>
          </div>
          {redemptions.length ? <div className="request-list">{redemptions.map((item) => <article className="data-row" key={item.id}><div className="data-row-copy"><h3>{item.rewardName}</h3><p>{item.pointsCost} poin - {item.status} - {new Date(item.createdAt).toLocaleDateString("id-ID")}</p></div></article>)}</div> : <div className="empty-state"><div className="empty-icon">+</div><h3>Belum ada reward</h3><p>Reward yang kamu tukarkan akan muncul di sini.</p></div>}
        </section>

        <section className="content-card points-history">
          <div className="section-heading">
            <h2>Riwayat Poin</h2>
            <p>Poin masuk setelah pickup selesai dan berat aktual tervalidasi.</p>
          </div>
          {history.length ? <div className="request-list">{history.map((item) => <article className="data-row" key={item.id}><div className="data-row-copy"><h3>+{item.amount} poin</h3><p>{item.description || "Pickup selesai"} - {new Date(item.createdAt).toLocaleDateString("id-ID")}</p></div></article>)}</div> : <div className="empty-state">
            <div className="empty-icon">+</div>
            <h3>Belum ada riwayat poin.</h3>
            <p>Riwayat poin akan muncul setelah permintaan selesai.</p>
          </div>}
        </section>
      </section>
    </main>
  )
}
