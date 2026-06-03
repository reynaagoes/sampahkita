"use client"

import Navbar from "@/components/Navbar"
import PickupTimeline from "@/components/PickupTimeline"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { formatWasteTypes, getRequestStatus, getRequestStatusLabel } from "@/lib/request-status"
import { getWhatsAppUrl } from "@/lib/phone"

type RequestItem = {
  id?: string
  status?: string
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
  pointsAwarded?: number | string
  collectorName?: string
  collectorPhone?: string
  collector?: {
    id?: string
    fullName?: string | null
    phone?: string | null
  } | null
  contactPhone?: string
  updatedAt?: string
}

function formatDate(value?: string) {
  if (!value) return "Belum dijadwalkan"
  return new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

export default function HouseholdDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const role = String(session?.user?.role || "").toUpperCase()

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

  const active = requests.filter((item) => ["OPEN", "ASSIGNED", "ON_THE_WAY", "ARRIVED", "WEIGHED"].includes(String(item.status))).length
  const done = requests.filter((item) => item.status === "COMPLETED").length
  const totalWeight = requests.reduce((sum, item) => sum + Number(item.actualWeight || item.estimatedWeight || 0), 0)
  const co2 = (done * 2.5).toFixed(1)
  const firstName = session?.user?.name?.split(" ")[0] || "JOO"
  const activeRequest = requests.find((item) => !["COMPLETED", "CANCELLED"].includes(String(item.status || "").toUpperCase()))

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

        <section className="classic-panel pickup-tracking-card">
          <div className="panel-head">
            <div>
              <h2>Tracking Pickup Terbaru</h2>
              <p>Pantau progress penjemputan seperti tracking order.</p>
            </div>
          </div>

          {!activeRequest ? (
            <div className="empty-state">
              <div className="empty-icon">+</div>
              <h3>Belum ada pickup aktif</h3>
              <p>Belum ada pickup aktif. Buat request angkut sampah untuk mulai tracking.</p>
            </div>
          ) : (
            <>
              <div className="pickup-tracking-layout">
                <div className="pickup-action-card">
                  <span className="data-eyebrow">Status saat ini</span>
                  <h3>{getRequestStatusLabel(activeRequest.status)}</h3>
                  <dl className="pickup-detail-list">
                    <div>
                      <dt>Jenis sampah</dt>
                      <dd>{activeRequest.wasteType || activeRequest.type || activeRequest.category || formatWasteTypes(activeRequest.sampahTypes)}</dd>
                    </div>
                    <div>
                      <dt>Alamat</dt>
                      <dd>{activeRequest.addressDetail || activeRequest.address || "Alamat penjemputan tersimpan"}</dd>
                    </div>
                    <div>
                      <dt>Estimasi berat</dt>
                      <dd>{activeRequest.estimatedWeight ? `${activeRequest.estimatedWeight} kg` : "Belum diisi"}</dd>
                    </div>
                    <div>
                      <dt>Berat aktual</dt>
                      <dd>{activeRequest.actualWeight ? `${activeRequest.actualWeight} kg` : "Menunggu penimbangan"}</dd>
                    </div>
                    <div>
                      <dt>Poin</dt>
                      <dd>{Number(activeRequest.pointsAwarded || 0) > 0 ? `${Number(activeRequest.pointsAwarded).toLocaleString("id-ID")} poin` : "Diberikan setelah pickup selesai"}</dd>
                    </div>
                  </dl>
                </div>

                <PickupTimeline
                  status={activeRequest.status || "OPEN"}
                  createdAt={activeRequest.createdAt}
                  updatedAt={activeRequest.updatedAt}
                  collector={activeRequest.collector || {
                    fullName: activeRequest.collectorName || null,
                    phone: activeRequest.collectorPhone || null,
                  }}
                  actualWeight={activeRequest.actualWeight}
                  pointsAwarded={activeRequest.pointsAwarded}
                />
              </div>

              <PickupContactCard request={activeRequest} />
            </>
          )}
        </section>

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
                  const statusInfo = getRequestStatus(item.status)
                  return (
                    <div className="request-row" key={item.id || index}>
                      <div className="date-card">
                        <strong>{formatDate(item.scheduledAt || item.createdAt).split(" ")[0]}</strong>
                        <span>{formatDate(item.scheduledAt || item.createdAt).split(" ").slice(1).join(" ")}</span>
                      </div>
                      <div>
                        <h3>{item.wasteType || item.type || item.category || formatWasteTypes(item.sampahTypes)}</h3>
                        <p>{item.addressDetail || item.address || "Alamat penjemputan tersimpan"}</p>
                        {(item.collector?.fullName || item.collectorName) && <p>Pengepul: {item.collector?.fullName || item.collectorName} {(item.collector?.phone || item.collectorPhone) && <a href={`tel:${item.collector?.phone || item.collectorPhone}`}>- Hubungi Pengepul</a>}</p>}
                        {item.contactPhone && <p>Kontak pickup: {item.contactPhone}</p>}
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
              <button type="button" onClick={() => router.push("/guide/pilah-sampah")}>Panduan Pilah Sampah</button>
            </div>
          </aside>
        </section>

      </section>
    </main>
  )
}

function PickupContactCard({ request }: { request: RequestItem }) {
  const collectorName = request.collector?.fullName || request.collectorName
  const collectorPhone = request.collector?.phone || request.collectorPhone
  const waUrl = getWhatsAppUrl(collectorPhone)

  if (!collectorName && !collectorPhone) {
    return (
      <div className="pickup-contact-card">
        <div>
          <strong>Pengepul belum menerima request ini.</strong>
          <p>Informasi kontak akan muncul setelah request diambil pengepul.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pickup-contact-card">
      <div>
        <strong>Pengepul: {collectorName || "Nama belum tersedia"}</strong>
        <p>Nomor: {collectorPhone || "Nomor belum tersedia"}</p>
      </div>
      <div className="pickup-contact-actions">
        {collectorPhone ? <a className="green-small-btn" href={`tel:${collectorPhone}`}>Hubungi Pengepul</a> : <span className="status-pill warning">Nomor belum tersedia</span>}
        {waUrl && <a className="outline-btn" href={waUrl} target="_blank" rel="noreferrer">WhatsApp</a>}
      </div>
    </div>
  )
}
