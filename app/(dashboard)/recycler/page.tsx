"use client"

import Navbar from "@/components/Navbar"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type Batch = {
  id: string
  wasteType: string
  collectorName?: string | null
  totalWeight: number | string
  pricePerKg: number | string
  location?: string | null
}

export default function RecyclerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [batches, setBatches] = useState<Batch[]>([])
  const [myPurchases, setMyPurchases] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"available" | "purchases" | "stats">("available")
  const role = String(session?.user?.role || "")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated" && role !== "RECYCLER") router.replace(role === "HOUSEHOLD" ? "/household" : role === "COLLECTOR" ? "/collector" : "/admin")
  }, [status, role, router])

  useEffect(() => {
    if (status === "authenticated" && role === "RECYCLER") void fetchData()
  }, [status, role])

  async function fetchData() {
    setLoading(true)
    const [available, purchases] = await Promise.all([
      fetch("/api/batches/available").then((response) => response.json()),
      fetch("/api/batches/my-purchases").then((response) => response.json()),
    ])
    setBatches(available.batches || [])
    setMyPurchases(purchases.batches || [])
    setLoading(false)
  }

  async function purchase(batchId: string) {
    const response = await fetch(`/api/batches/${batchId}/purchase`, { method: "POST" })
    if (response.ok) {
      alert("Pembelian batch berhasil.")
      void fetchData()
    } else {
      const data = await response.json()
      alert(data.error)
    }
  }

  if (status !== "authenticated" || role !== "RECYCLER") return <div className="page-loader">Memeriksa akses...</div>

  const totalBought = myPurchases.reduce((total, batch) => total + Number(batch.totalWeight || 0), 0)
  const materialTypes = new Set(myPurchases.map((batch) => batch.wasteType)).size

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
            <button className={tab === "purchases" ? "active" : ""} type="button" onClick={() => setTab("purchases")}>Pembelian Saya <span>{myPurchases.length}</span></button>
            <button className={tab === "stats" ? "active" : ""} type="button" onClick={() => setTab("stats")}>Statistik Material</button>
          </div>

          {loading ? (
            <div className="empty-state"><p>Memuat data...</p></div>
          ) : tab === "available" ? (
            batches.length ? batches.map((batch) => <BatchRow batch={batch} key={batch.id} action={() => void purchase(batch.id)} />) :
              <EmptyState title="Belum ada batch material" text="Batch dari pengepul terverifikasi akan muncul di sini." />
          ) : tab === "purchases" ? (
            myPurchases.length ? myPurchases.map((batch) => <BatchRow batch={batch} key={batch.id} purchased />) :
              <EmptyState title="Belum ada pembelian" text="Batch yang dibeli akan tersimpan di bagian ini." />
          ) : (
            <div className="material-stats">
              <article><span>Total berat dibeli</span><strong>{totalBought.toFixed(1)} kg</strong></article>
              <article><span>Jenis material</span><strong>{materialTypes}</strong></article>
              <article><span>Total transaksi</span><strong>{myPurchases.length}</strong></article>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

function BatchRow({ batch, action, purchased = false }: { batch: Batch; action?: () => void; purchased?: boolean }) {
  return (
    <article className="data-row">
      <div className="data-row-copy">
        <span className="data-eyebrow">{batch.wasteType}</span>
        <h3>{batch.totalWeight} kg material</h3>
        <p>Dari {batch.collectorName || "Pengepul terverifikasi"} {batch.location ? `- ${batch.location}` : ""}</p>
      </div>
      <div className="row-actions">
        <strong className="batch-price">Rp {Number(batch.pricePerKg).toLocaleString("id-ID")}/kg</strong>
        {purchased ? <span className="status-pill success">Terbeli</span> : <><button className="outline-btn" type="button" disabled title="Halaman detail batch belum tersedia">Lihat Detail</button><button className="green-small-btn" type="button" onClick={action}>Beli Batch</button></>}
      </div>
    </article>
  )
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><div className="empty-icon">+</div><h3>{title}</h3><p>{text}</p></div>
}
