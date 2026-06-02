"use client"

import Navbar from "@/components/Navbar"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type PickupRequest = {
  id: string
  sampahTypes?: string | null
  addressDetail?: string | null
  householdName?: string | null
  status: string
  actualWeight?: number | string | null
  estimatedWeight?: number | string | null
  createdAt?: string | null
}

type MaterialBatch = {
  id: string
  wasteType: string
  totalWeight: number | string
  pricePerKg: number | string
  status: string
}

function getTypes(req: PickupRequest) {
  try {
    return JSON.parse(req.sampahTypes || "[]").join(" / ") || "Sampah rumah tangga"
  } catch {
    return "Sampah rumah tangga"
  }
}

function PickupCard({ req, onComplete }: { req: PickupRequest; onComplete: (id: string, weight: string) => Promise<void> }) {
  const [weight, setWeight] = useState("")

  return (
    <article className="data-row">
      <div className="data-row-copy">
        <span className="data-eyebrow">{getTypes(req)}</span>
        <h3>{req.addressDetail || "Alamat penjemputan"}</h3>
        <p>Dari {req.householdName || "Rumah tangga"} {req.estimatedWeight ? `- estimasi ${req.estimatedWeight} kg` : ""}</p>
        <p>{req.createdAt ? `Dibuat ${new Date(req.createdAt).toLocaleDateString("id-ID")}` : "Jadwal pickup mengikuti konfirmasi pengepul."}</p>
      </div>
      {req.status === "COMPLETED" ? (
        <span className="status-pill success">Selesai - {req.actualWeight || 0} kg</span>
      ) : (
        <div className="row-actions collector-weight-actions">
          <input type="number" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="Input berat (kg)" />
          <button className="green-small-btn" type="button" disabled={!weight} onClick={() => void onComplete(req.id, weight)}>
            Selesaikan Pickup
          </button>
        </div>
      )}
    </article>
  )
}

export default function CollectorDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<PickupRequest[]>([])
  const [myPickups, setMyPickups] = useState<PickupRequest[]>([])
  const [batches, setBatches] = useState<MaterialBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState("")
  const [tab, setTab] = useState<"available" | "mypickups" | "batches">("available")
  const role = String(session?.user?.role || "")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated" && role !== "COLLECTOR") router.replace(role === "HOUSEHOLD" ? "/household" : role === "RECYCLER" ? "/recycler" : "/admin")
  }, [status, role, router])

  useEffect(() => {
    if (status === "authenticated" && role === "COLLECTOR") void fetchData()
  }, [status, role])

  async function fetchData() {
    setLoading(true)
    const [available, pickups, materialBatches] = await Promise.all([
      fetch("/api/requests/available").then((response) => response.json()),
      fetch("/api/requests/my-pickups").then((response) => response.json()),
      fetch("/api/batches").then((response) => response.json()),
    ])
    setRequests(available.requests || [])
    setMyPickups(pickups.requests || [])
    setBatches(materialBatches.batches || [])
    setNotice(available.error || pickups.error || materialBatches.error || "")
    setLoading(false)
  }

  async function acceptRequest(id: string) {
    const response = await fetch(`/api/requests/${id}/accept`, { method: "POST" })
    if (response.ok) void fetchData()
  }

  async function completeRequest(id: string, weight: string) {
    if (!weight) return
    const response = await fetch(`/api/requests/${id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actualWeight: parseFloat(weight) }),
    })
    if (response.ok) {
      const data = await response.json()
      alert(`Pickup selesai. Rumah tangga mendapat ${data.pointsEarned} poin.`)
      void fetchData()
    }
  }

  if (status !== "authenticated" || role !== "COLLECTOR") return <div className="page-loader">Memeriksa akses...</div>

  const activePickups = myPickups.filter((request) => request.status !== "COMPLETED").length
  const completedPickups = myPickups.filter((request) => request.status === "COMPLETED")
  const totalCollected = completedPickups.reduce((total, request) => total + Number(request.actualWeight || 0), 0)

  return (
    <main className="app-page">
      <section className="role-hero">
        <Navbar userName={session?.user?.name || ""} role="COLLECTOR" />
        <div className="role-hero-content">
          <span className="section-kicker">Dashboard Pengepul</span>
          <h1>Halo, {session.user.name?.split(" ")[0]}. Ambil request sampah dan kelola pickup harianmu.</h1>
          <p>Pengepul mengambil request, input berat aktual, menyelesaikan pickup, lalu menyiapkan batch material untuk Recycler.</p>
          <button className="light-btn" type="button" onClick={() => setTab("available")}>Ambil Request Sampah</button>
        </div>
      </section>

      <section className="role-dashboard-shell">
        <div className="role-stat-grid role-stat-grid-four">
          <article className="stat-card"><small>Request Tersedia</small><strong>{requests.length}</strong><span>siap diambil</span></article>
          <article className="stat-card"><small>Pickup Aktif</small><strong>{activePickups}</strong><span>perlu diselesaikan</span></article>
          <article className="stat-card"><small>Pickup Selesai</small><strong>{completedPickups.length}</strong><span>sudah tervalidasi</span></article>
          <article className="stat-card"><small>Berat Terkumpul</small><strong>{totalCollected.toFixed(1)}</strong><span>kg material</span></article>
        </div>

        <div className="role-info-card">
          <strong>{notice ? "Status akses pengepul" : "Alur poin rumah tangga"}</strong>
          <span>{notice || "Setelah pickup selesai dan berat aktual dimasukkan, poin otomatis diberikan kepada rumah tangga."}</span>
        </div>

        <section className="content-card role-workspace">
          <div className="tab-list">
            <button className={tab === "available" ? "active" : ""} type="button" onClick={() => setTab("available")}>Request Tersedia <span>{requests.length}</span></button>
            <button className={tab === "mypickups" ? "active" : ""} type="button" onClick={() => setTab("mypickups")}>Pickup Saya <span>{myPickups.length}</span></button>
            <button className={tab === "batches" ? "active" : ""} type="button" onClick={() => setTab("batches")}>Batch Material <span>{batches.length}</span></button>
          </div>

          {loading ? (
            <div className="empty-state"><p>Memuat data...</p></div>
          ) : tab === "available" ? (
            requests.length ? requests.map((request) => (
              <article className="data-row" key={request.id}>
                <div className="data-row-copy">
                  <span className="data-eyebrow">{getTypes(request)}</span>
                  <h3>{request.addressDetail || "Alamat penjemputan"}</h3>
                  <p>Dari {request.householdName || "Rumah tangga"} {request.estimatedWeight ? `- estimasi ${request.estimatedWeight} kg` : ""}</p>
                  <p>{request.createdAt ? `Dibuat ${new Date(request.createdAt).toLocaleDateString("id-ID")}` : "Jadwal pickup mengikuti konfirmasi pengepul."}</p>
                </div>
                <div className="row-actions">
                  <button className="outline-btn" type="button" disabled title="Halaman detail request belum tersedia">Lihat Detail - Segera Hadir</button>
                  <button className="green-small-btn" type="button" onClick={() => void acceptRequest(request.id)}>Ambil Request</button>
                </div>
              </article>
            )) : <EmptyState title="Tidak ada request tersedia" text="Request baru dari rumah tangga akan muncul di sini." />
          ) : tab === "mypickups" ? (
            myPickups.length ? myPickups.map((request) => <PickupCard key={request.id} req={request} onComplete={completeRequest} />) :
              <EmptyState title="Belum ada pickup" text="Ambil request sampah untuk mulai mengelola pickup." />
          ) : batches.length ? (
            <>
              {batches.map((batch) => (
                <article className="data-row" key={batch.id}>
                  <div className="data-row-copy">
                    <span className="data-eyebrow">{batch.wasteType}</span>
                    <h3>{batch.totalWeight} kg material</h3>
                    <p>Rp {Number(batch.pricePerKg).toLocaleString("id-ID")}/kg - status {batch.status.toLowerCase()}</p>
                  </div>
                  <span className="status-pill success">{batch.status}</span>
                </article>
              ))}
              <div className="workspace-footer"><button className="green-small-btn" type="button" onClick={() => router.push("/collector/batch/new")}>Buat Batch Material</button></div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">+</div>
              <h3>Siapkan batch material</h3>
              <p>Buat listing material setelah sampah terkumpul dan terpilah.</p>
              <button className="green-small-btn" type="button" onClick={() => router.push("/collector/batch/new")}>Buat Batch Material</button>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><div className="empty-icon">+</div><h3>{title}</h3><p>{text}</p></div>
}
