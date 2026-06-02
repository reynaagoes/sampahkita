"use client"

import Navbar from "@/components/Navbar"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

type Batch = {
  id: string
  wasteType: string
  collectorName?: string | null
  totalWeight: number | string
  pricePerKg: number | string
  location?: string | null
  description?: string | null
  status?: string | null
  grade?: string | null
  collectorPhone?: string | null
}

export default function RecyclerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [batches, setBatches] = useState<Batch[]>([])
  const [myPurchases, setMyPurchases] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [tab, setTab] = useState<"available" | "requested" | "active" | "history">("available")
  const role = String(session?.user?.role || "").toUpperCase()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [available, purchases] = await Promise.all([
      fetch("/api/batches/available").then((response) => response.json()),
      fetch("/api/batches/my-purchases").then((response) => response.json()),
    ])
    setBatches(available.batches || [])
    setMyPurchases(purchases.batches || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated" && role !== "RECYCLER") router.replace(role === "HOUSEHOLD" ? "/household" : role === "COLLECTOR" ? "/collector" : "/admin")
  }, [status, role, router])

  useEffect(() => {
    if (status === "authenticated" && role === "RECYCLER") void Promise.resolve().then(fetchData)
  }, [status, role, fetchData])

  async function purchase(batchId: string) {
    const response = await fetch(`/api/batches/${batchId}/purchase`, { method: "POST" })
    if (response.ok) {
      alert("Pengajuan pembelian dikirim ke pengepul.")
      void fetchData()
    } else {
      const data = await response.json()
      alert(data.error)
    }
  }

  async function confirmReceived(batchId: string) {
    const response = await fetch(`/api/batches/${batchId}/confirm`, { method: "POST" })
    if (response.ok) {
      alert("Penerimaan material dikonfirmasi.")
      void fetchData()
    } else alert((await response.json().catch(() => ({}))).error || "Penerimaan tidak dapat dikonfirmasi")
  }

  if (status !== "authenticated" || role !== "RECYCLER") return <div className="page-loader">Memeriksa akses...</div>

  const totalBought = myPurchases.reduce((total, batch) => total + Number(batch.totalWeight || 0), 0)
  const materialTypes = new Set(myPurchases.map((batch) => batch.wasteType)).size
  const requested = myPurchases.filter((batch) => ["PURCHASE_REQUESTED", "REJECTED"].includes(String(batch.status)))
  const active = myPurchases.filter((batch) => ["APPROVED", "DELIVERED"].includes(String(batch.status)))
  const history = myPurchases.filter((batch) => ["COMPLETED", "SOLD"].includes(String(batch.status)))

  return (
    <main className="app-page">
      <section className="role-hero">
        <Navbar userName={session?.user?.name || ""} role="RECYCLER" />
        <div className="role-hero-content">
          <span className="section-kicker">Dashboard Recycler</span>
          <h1>Selamat datang, {session.user.name?.split(" ")[0]}. Beli batch material daur ulang dari pengepul terverifikasi.</h1>
          <p>Lihat batch tersedia, pilih material, beli batch, dan pantau riwayat pembelianmu.</p>
          <button className="light-btn" type="button" onClick={() => setTab("available")}>Cari Batch Material</button>
        </div>
      </section>

      <section className="role-dashboard-shell">
        <div className="role-stat-grid role-stat-grid-four">
          <article className="stat-card"><small>Batch Tersedia</small><strong>{batches.length}</strong><span>siap dibeli</span></article>
          <article className="stat-card"><small>Pembelian Saya</small><strong>{myPurchases.length}</strong><span>batch terbeli</span></article>
          <article className="stat-card"><small>Total Material</small><strong>{totalBought.toFixed(1)}</strong><span>kg material dibeli</span></article>
          <article className="stat-card"><small>Kategori Aktif</small><strong>{materialTypes}</strong><span>jenis material dibeli</span></article>
        </div>

        <div className="role-info-card">
          <strong>Butuh barang layak pakai?</strong>
          <span>PasarCuan adalah fitur tambahan untuk melihat listing barang dari pengguna lain.</span>
          <button className="outline-btn" type="button" onClick={() => router.push("/bid")}>Buka PasarCuan</button>
        </div>

        <section className="content-card role-workspace">
          <div className="tab-list">
            <button className={tab === "available" ? "active" : ""} type="button" onClick={() => setTab("available")}>Batch Material Tersedia <span>{batches.length}</span></button>
            <button className={tab === "requested" ? "active" : ""} type="button" onClick={() => setTab("requested")}>Pengajuan Pembelian <span>{requested.length}</span></button>
            <button className={tab === "active" ? "active" : ""} type="button" onClick={() => setTab("active")}>Pembelian Aktif <span>{active.length}</span></button>
            <button className={tab === "history" ? "active" : ""} type="button" onClick={() => setTab("history")}>Riwayat Pembelian <span>{history.length}</span></button>
          </div>

          {loading ? (
            <div className="empty-state"><p>Memuat data...</p></div>
          ) : tab === "available" ? (
            batches.length ? <>{batches.map((batch) => <BatchRow batch={batch} key={batch.id} action={() => void purchase(batch.id)} onDetail={() => setSelectedBatch(batch)} />)}{selectedBatch && <BatchDetail batch={selectedBatch} close={() => setSelectedBatch(null)} />}</> :
              <EmptyState title="Belum ada batch material" text="Batch akan muncul setelah pengepul terverifikasi menyelesaikan pickup dan membuat batch material." />
          ) : tab === "requested" ? (
            requested.length ? requested.map((batch) => <BatchRow batch={batch} key={batch.id} purchased />) : <EmptyState title="Belum ada pengajuan" text="Batch yang diajukan akan tampil di sini." />
          ) : tab === "active" ? (
            active.length ? active.map((batch) => <BatchRow batch={batch} key={batch.id} purchased confirm={batch.status === "DELIVERED" ? () => void confirmReceived(batch.id) : undefined} />) : <EmptyState title="Belum ada pembelian aktif" text="Pembelian yang disetujui pengepul akan tampil di sini." />
          ) : history.length ? history.map((batch) => <BatchRow batch={batch} key={batch.id} purchased />) : <EmptyState title="Belum ada riwayat pembelian" text="Material yang selesai diterima akan tersimpan di sini." />}
        </section>
      </section>
    </main>
  )
}

function BatchRow({ batch, action, onDetail, purchased = false, confirm }: { batch: Batch; action?: () => void; onDetail?: () => void; purchased?: boolean; confirm?: () => void }) {
  return (
    <article className="data-row">
      <div className="data-row-copy">
        <span className="data-eyebrow">{batch.wasteType}</span>
        <h3>{batch.totalWeight} kg material</h3>
        <p>Dari {batch.collectorName || "Pengepul terverifikasi"} {batch.location ? `- ${batch.location}` : ""}</p>
      </div>
      <div className="row-actions">
        <strong className="batch-price">Rp {Number(batch.pricePerKg).toLocaleString("id-ID")}/kg</strong>
        {purchased ? <><span className="status-pill success">{batch.status}</span>{["APPROVED", "DELIVERED"].includes(String(batch.status)) && batch.collectorPhone && <a className="outline-btn" href={`tel:${batch.collectorPhone}`}>Hubungi Pengepul</a>}{confirm && <button className="green-small-btn" type="button" onClick={confirm}>Konfirmasi Diterima</button>}</> : <><button className="outline-btn" type="button" onClick={onDetail}>Lihat Detail</button><button className="green-small-btn" type="button" onClick={action}>Ajukan Pembelian</button></>}
      </div>
    </article>
  )
}

function BatchDetail({ batch, close }: { batch: Batch; close: () => void }) {
  return (
    <article className="batch-detail-card">
      <div>
        <span className="data-eyebrow">Detail Batch Material</span>
        <h3>{batch.wasteType} - {batch.totalWeight} kg - grade {batch.grade || "B"}</h3>
        <p>{batch.description || "Pengepul belum menambahkan catatan kualitas material."}</p>
        <p>Lokasi: {batch.location || "Belum dicantumkan"} | Harga: Rp {Number(batch.pricePerKg).toLocaleString("id-ID")}/kg</p>
      </div>
      <button className="outline-btn" type="button" onClick={close}>Tutup Detail</button>
    </article>
  )
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><div className="empty-icon">+</div><h3>{title}</h3><p>{text}</p></div>
}
