"use client"

import Navbar from "@/components/Navbar"
import PickupTimeline from "@/components/PickupTimeline"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { formatWasteTypes, getRequestStatus, getRequestStatusLabel } from "@/lib/request-status"

type PickupRequest = {
  id: string
  sampahTypes?: string | null
  addressDetail?: string | null
  householdName?: string | null
  householdPhone?: string | null
  status: string
  actualWeight?: number | string | null
  estimatedWeight?: number | string | null
  createdAt?: string | null
  updatedAt?: string | null
  contactPhone?: string | null
}

type MaterialBatch = {
  id: string
  wasteType: string
  totalWeight: number | string
  pricePerKg: number | string
  status: string
  recyclerName?: string | null
}

type InventoryItem = {
  id: string
  wasteType: string
  availableWeight: number | string
}

function getTypes(req: PickupRequest) {
  return formatWasteTypes(req.sampahTypes)
}

function PickupCard({ req, onStatus, onPickup, onComplete }: { req: PickupRequest; onStatus: (id: string, status: string) => Promise<void>; onPickup: (id: string, weight: string) => Promise<void>; onComplete: (id: string) => Promise<void> }) {
  const [weight, setWeight] = useState("")
  const statusInfo = getRequestStatus(req.status)
  const householdPhone = req.contactPhone || req.householdPhone

  return (
    <article className="pickup-action-card collector-pickup-card">
      <div className="collector-pickup-main">
        <div className="data-row-copy">
          <span className="data-eyebrow">{getTypes(req)}</span>
          <h3>{req.addressDetail || "Alamat penjemputan"}</h3>
          <p>Household: {req.householdName || "Rumah tangga"} {req.estimatedWeight ? `- estimasi ${req.estimatedWeight} kg` : ""}</p>
          <p>Nomor: {householdPhone || "Nomor tidak tersedia"}</p>
          <p>Status: {getRequestStatusLabel(req.status)} {req.actualWeight ? `- ${req.actualWeight} kg` : ""}</p>
          <p>{req.createdAt ? `Dibuat ${new Date(req.createdAt).toLocaleDateString("id-ID")}` : "Jadwal pickup mengikuti konfirmasi pengepul."}</p>
        </div>

        <div className="row-actions collector-pickup-actions">
          {householdPhone ? <a className="outline-btn" href={`tel:${householdPhone}`}>Hubungi Household</a> : <span className="status-pill warning">Nomor tidak tersedia</span>}
          {req.status === "ASSIGNED" ? (
            <button className="green-small-btn" type="button" onClick={() => void onStatus(req.id, "ON_THE_WAY")}>Saya Berangkat</button>
          ) : req.status === "ON_THE_WAY" ? (
            <button className="green-small-btn" type="button" onClick={() => void onStatus(req.id, "ARRIVED")}>Saya Sudah Tiba</button>
          ) : req.status === "ARRIVED" ? (
            <div className="row-actions collector-weight-actions">
              <input type="number" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="Berat aktual (kg)" />
              <button className="green-small-btn" type="button" disabled={!weight} onClick={() => void onPickup(req.id, weight)}>
                Simpan Berat
              </button>
            </div>
          ) : req.status === "WEIGHED" ? (
            <>
              <span className={`status-pill ${statusInfo.tone}`}>{statusInfo.label} - {req.actualWeight || 0} kg</span>
              <button className="green-small-btn" type="button" onClick={() => void onComplete(req.id)}>
                Selesaikan Pickup
              </button>
            </>
          ) : (
            <span className={`status-pill ${statusInfo.tone}`}>{statusInfo.label}{req.actualWeight ? ` - ${req.actualWeight} kg` : ""}</span>
          )}
        </div>
      </div>

      <PickupTimeline
        compact
        status={req.status}
        createdAt={req.createdAt || undefined}
        updatedAt={req.updatedAt || undefined}
        actualWeight={req.actualWeight}
      />
    </article>
  )
}

export default function CollectorDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<PickupRequest[]>([])
  const [myPickups, setMyPickups] = useState<PickupRequest[]>([])
  const [batches, setBatches] = useState<MaterialBatch[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [purchaseRequests, setPurchaseRequests] = useState<MaterialBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState("")
  const [tab, setTab] = useState<"available" | "mypickups" | "inventory" | "batches" | "purchases">("available")
  const role = String(session?.user?.role || "").toUpperCase()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [available, pickups, materialBatches, materialInventory, purchases] = await Promise.all([
      fetch("/api/requests/available").then((response) => response.json()),
      fetch("/api/requests/my-pickups").then((response) => response.json()),
      fetch("/api/batches").then((response) => response.json()),
      fetch("/api/inventory").then((response) => response.json()),
      fetch("/api/batches/purchase-requests").then((response) => response.json()),
    ])
    setRequests(available.requests || [])
    setMyPickups(pickups.requests || [])
    setBatches(materialBatches.batches || [])
    setInventory(materialInventory.inventory || [])
    setPurchaseRequests(purchases.batches || [])
    setNotice(available.error || pickups.error || materialBatches.error || materialInventory.error || purchases.error || "")
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated" && role !== "COLLECTOR") router.replace(role === "HOUSEHOLD" ? "/household" : role === "RECYCLER" ? "/recycler" : "/admin")
  }, [status, role, router])

  useEffect(() => {
    if (status === "authenticated" && role === "COLLECTOR") void Promise.resolve().then(fetchData)
  }, [status, role, fetchData])

  async function acceptRequest(id: string) {
    const response = await fetch(`/api/requests/${id}/accept`, { method: "POST" })
    const data = await response.json().catch(() => ({}))
    if (response.ok) void fetchData()
    else alert(data.error || "Request tidak dapat diambil")
  }

  async function pickupRequest(id: string, weight: string) {
    if (!weight) return
    const response = await fetch(`/api/requests/${id}/pickup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actualWeight: parseFloat(weight) }),
    })
    const data = await response.json().catch(() => ({}))
    if (response.ok) void fetchData()
    else alert(data.error || "Berat aktual tidak dapat disimpan")
  }

  async function updatePickupStatus(id: string, pickupStatus: string) {
    const response = await fetch(`/api/requests/${id}/status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: pickupStatus }) })
    if (response.ok) void fetchData()
    else alert((await response.json().catch(() => ({}))).error || "Status pickup tidak dapat diperbarui")
  }

  async function updateBatch(id: string, endpoint: string, body?: object) {
    const response = await fetch(`/api/batches/${id}/${endpoint}`, { method: "POST", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined })
    if (response.ok) void fetchData()
    else alert((await response.json().catch(() => ({}))).error || "Status batch tidak dapat diperbarui")
  }

  async function completeRequest(id: string) {
    const response = await fetch(`/api/requests/${id}/complete`, { method: "POST" })
    if (response.ok) {
      const data = await response.json()
      alert(`Pickup selesai. Rumah tangga mendapat ${data.pointsEarned} poin.`)
      void fetchData()
    } else alert((await response.json().catch(() => ({}))).error || "Pickup tidak dapat diselesaikan")
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
            <button className={tab === "inventory" ? "active" : ""} type="button" onClick={() => setTab("inventory")}>Inventori Material <span>{inventory.length}</span></button>
            <button className={tab === "batches" ? "active" : ""} type="button" onClick={() => setTab("batches")}>Batch Material <span>{batches.length}</span></button>
            <button className={tab === "purchases" ? "active" : ""} type="button" onClick={() => setTab("purchases")}>Permintaan Pembelian <span>{purchaseRequests.filter((batch) => batch.status === "PURCHASE_REQUESTED").length}</span></button>
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
                  {(request.contactPhone || request.householdPhone) && <p><a href={`tel:${request.contactPhone || request.householdPhone}`}>Hubungi Household</a></p>}
                  <p>{request.createdAt ? `Dibuat ${new Date(request.createdAt).toLocaleDateString("id-ID")}` : "Jadwal pickup mengikuti konfirmasi pengepul."}</p>
                </div>
                <div className="row-actions">
                  <button className="outline-btn" type="button" disabled title="Halaman detail request belum tersedia">Lihat Detail - Segera Hadir</button>
                  <button className="green-small-btn" type="button" onClick={() => void acceptRequest(request.id)}>Ambil Request</button>
                </div>
              </article>
            )) : <EmptyState title="Tidak ada request tersedia" text="Request baru dari rumah tangga akan muncul di sini." />
          ) : tab === "mypickups" ? (
            myPickups.length ? myPickups.map((request) => <PickupCard key={request.id} req={request} onStatus={updatePickupStatus} onPickup={pickupRequest} onComplete={completeRequest} />) :
              <EmptyState title="Belum ada pickup" text="Ambil request sampah untuk mulai mengelola pickup." />
          ) : tab === "inventory" ? (
            inventory.length ? inventory.map((item) => <article className="data-row" key={item.id}><div className="data-row-copy"><span className="data-eyebrow">{item.wasteType}</span><h3>{Number(item.availableWeight).toFixed(1)} kg tersedia</h3><p>Stok bertambah setelah pickup selesai dan berkurang ketika batch dibuat.</p></div></article>) : <EmptyState title="Inventori masih kosong" text="Material dari pickup selesai akan masuk ke sini." />
          ) : tab === "batches" ? (
            batches.length ? <>{batches.map((batch) => (
              <article className="data-row" key={batch.id}><div className="data-row-copy"><span className="data-eyebrow">{batch.wasteType}</span><h3>{batch.totalWeight} kg material</h3><p>Rp {Number(batch.pricePerKg).toLocaleString("id-ID")}/kg - status {batch.status.toLowerCase()}</p></div><span className="status-pill success">{batch.status}</span></article>
            ))}<div className="workspace-footer"><button className="green-small-btn" type="button" onClick={() => router.push("/collector/batch/new")}>Buat Batch Material</button></div></> :
              <div className="empty-state"><div className="empty-icon">+</div><h3>Siapkan batch material</h3><p>Buat listing material setelah sampah terkumpul dan terpilah.</p><button className="green-small-btn" type="button" onClick={() => router.push("/collector/batch/new")}>Buat Batch Material</button></div>
          ) : purchaseRequests.length ? purchaseRequests.map((batch) => (
            <article className="data-row" key={batch.id}><div className="data-row-copy"><span className="data-eyebrow">{batch.wasteType}</span><h3>{batch.totalWeight} kg - {batch.recyclerName || "Recycler"}</h3><p>Rp {Number(batch.pricePerKg).toLocaleString("id-ID")}/kg - status {batch.status}</p></div><div className="row-actions">{batch.status === "PURCHASE_REQUESTED" && <><button className="outline-btn" type="button" onClick={() => void updateBatch(batch.id, "decision", { action: "REJECT" })}>Tolak</button><button className="green-small-btn" type="button" onClick={() => void updateBatch(batch.id, "decision", { action: "APPROVE" })}>Setujui</button></>}{batch.status === "APPROVED" && <button className="green-small-btn" type="button" onClick={() => void updateBatch(batch.id, "deliver")}>Material Diserahkan</button>}<span className="status-pill info">{batch.status}</span></div></article>
          )) : <EmptyState title="Belum ada permintaan pembelian" text="Pengajuan dari recycler akan muncul di sini." />}
        </section>
      </section>
    </main>
  )
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><div className="empty-icon">+</div><h3>{title}</h3><p>{text}</p></div>
}
