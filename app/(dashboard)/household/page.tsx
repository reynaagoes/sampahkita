"use client"

import Navbar from "@/components/Navbar"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type RequestItem = {
  id?: string
  status?: keyof typeof STATUS | string
  createdAt?: string
  scheduledAt?: string
  address?: string
  addressDetail?: string
  sampahTypes?: string
  wasteType?: string
  type?: string
  category?: string
  estimatedWeight?: number | string
  actualWeight?: number | string
}

const STATUS = {
  OPEN: { label: "Menunggu Penjemputan", tone: "warning" },
  ASSIGNED: { label: "Pengepul Menuju Lokasi", tone: "info" },
  PICKED_UP: { label: "Sedang Diproses", tone: "process" },
  COMPLETED: { label: "Selesai", tone: "success" },
  CANCELLED: { label: "Dibatalkan", tone: "danger" },
} as const

function formatDate(value?: string) {
  if (!value) return "Belum dijadwalkan"
  return new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

function getStatus(item: RequestItem) {
  const key = item.status || "OPEN"
  return STATUS[key as keyof typeof STATUS] || { label: key, tone: "info" }
}

export default function HouseholdDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const role = String(session?.user?.role || "")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated" && role !== "HOUSEHOLD") router.replace(role === "COLLECTOR" ? "/collector" : role === "RECYCLER" ? "/recycler" : "/admin")
  }, [status, role, router])

  useEffect(() => {
    if (status !== "authenticated" || role !== "HOUSEHOLD") return

    Promise.all([
      fetch("/api/requests").then((response) => response.json()).catch(() => ({ requests: [] })),
      fetch("/api/points").then((response) => response.json()).catch(() => ({ total: 0 })),
    ]).then(([req, pt]) => {
      setRequests(req.requests || [])
      setPoints(pt.total || 0)
      setLoading(false)
    })
  }, [status, role])

  if (status !== "authenticated" || role !== "HOUSEHOLD" || loading) {
    return <div className="page-loader">Memuat dashboard...</div>
  }

  const active = requests.filter((item) => ["OPEN", "ASSIGNED", "PICKED_UP"].includes(String(item.status))).length
  const done = requests.filter((item) => item.status === "COMPLETED").length
  const totalWeight = requests.reduce((sum, item) => sum + Number(item.actualWeight || item.estimatedWeight || 0), 0)
  const co2 = (done * 2.5).toFixed(1)
  const firstName = session?.user?.name?.split(" ")[0] || "JOO"

  return (
    <main className="app-page">
      <div className="dashboard-top">
        <Navbar userName={session?.user?.name || ""} role="HOUSEHOLD" />

        <section className="household-hero">
          <div>
            <span className="section-kicker">Dashboard Rumah Tangga</span>
            <h1>Selamat datang kembali, <span>{firstName}!</span></h1>
            <p>Kelola sampahmu, jadwalkan angkut gratis, lalu kumpulkan poin bersama CuanSampah.</p>
          </div>

          <div className="hero-service-note">
            <strong>Gratis</strong>
            <span>Penjemputan sampah dari rumah</span>
          </div>
        </section>
      </div>

      <section className="dashboard-container">
        <div className="pickup-banner">
          <div>
            <span className="free-label">LAYANAN UTAMA</span>
            <h2>Request Angkut Sampah Gratis</h2>
            <p>Kami datang ke rumahmu. Cukup pilih jadwal dan jenis sampah.</p>
          </div>
          <button className="pickup-action-btn" type="button" onClick={() => router.push("/household/request/new")}>
            Buat Request
          </button>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <small>Total Poin</small>
            <strong>{Number(points).toLocaleString("id-ID")}</strong>
            <span>poin terkumpul</span>
          </div>
          <div className="stat-card">
            <small>Request Aktif</small>
            <strong>{active}</strong>
            <span>menunggu penjemputan</span>
          </div>
          <div className="stat-card">
            <small>Total Selesai</small>
            <strong>{done}</strong>
            <span>pengambilan</span>
          </div>
          <div className="stat-card">
            <small>Dampak</small>
            <strong>{co2} kg</strong>
            <span>CO2 dicegah</span>
          </div>
        </div>

        <section className="dashboard-main-grid">
          <div className="classic-panel request-panel">
            <div className="panel-head">
              <div>
                <h2>Request Sampah</h2>
                <p>Jadwal dan status penjemputan gratis</p>
              </div>
              <button className="green-small-btn" type="button" onClick={() => router.push("/household/request/new")}>
                + Buat Request
              </button>
            </div>

            {requests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">+</div>
                <h3>Belum ada jadwal penjemputan</h3>
                <p>Buat request pertama untuk menikmati layanan gratis angkut sampah.</p>
              </div>
            ) : (
              <div className="request-list">
                {requests.slice(0, 4).map((item, index) => {
                  const statusInfo = getStatus(item)
                  return (
                    <div className="request-row" key={item.id || index}>
                      <div className="date-card">
                        <strong>{formatDate(item.scheduledAt || item.createdAt).split(" ")[0]}</strong>
                        <span>{formatDate(item.scheduledAt || item.createdAt).split(" ").slice(1).join(" ")}</span>
                      </div>
                      <div>
                        <h3>{item.wasteType || item.type || item.category || item.sampahTypes || "Sampah Rumah Tangga"}</h3>
                        <p>{item.addressDetail || item.address || "Alamat penjemputan tersimpan"}</p>
                      </div>
                      <span className={`status-pill ${statusInfo.tone}`}>{statusInfo.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <aside className="dashboard-side">
            <div className="classic-panel side-impact">
              <h2>Dampakmu untuk Bumi</h2>
              <div className="impact-circle" aria-hidden="true"><span /></div>
              <ul>
                <li><span>Sampah terkumpul</span><strong>{totalWeight.toFixed(1)} kg</strong></li>
                <li><span>CO2 dicegah</span><strong>{co2} kg</strong></li>
                <li><span>Transaksi</span><strong>{requests.length}</strong></li>
              </ul>
            </div>

            <div className="classic-panel quick-actions">
              <h2>Aksi Cepat</h2>
              <button type="button" onClick={() => router.push("/household/request/new")}>Buat Penjemputan</button>
              <button type="button" onClick={() => router.push("/points")}>Poin Saya</button>
              <button type="button" onClick={() => router.push("/bid")}>Buka PasarCuan</button>
              <button type="button">Panduan Pilah Sampah</button>
            </div>
          </aside>
        </section>

      </section>
    </main>
  )
}
