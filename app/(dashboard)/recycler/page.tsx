"use client"

import Navbar from "@/components/Navbar"
import BatchPurchaseTimeline from "@/components/BatchPurchaseTimeline"
import { getBatchStatus, getBatchStatusLabel, normalizeBatchStatus, resolveBatchFinance } from "@/lib/batch-status"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState, type FormEvent } from "react"

type Batch = {
  id: string
  wasteType: string
  collectorName?: string | null
  collectorPhone?: string | null
  collectorAddress?: string | null
  totalWeight: number | string
  pricePerKg: number | string
  location?: string | null
  description?: string | null
  status?: string | null
  grade?: string | null
  recyclerContactName?: string | null
  recyclerContactPhone?: string | null
  recyclerDeliveryAddress?: string | null
  offerPrice?: number | string | null
  counterPrice?: number | string | null
  agreedPrice?: number | string | null
  platformFee?: number | string | null
  collectorEarning?: number | string | null
  offerNote?: string | null
  counterNote?: string | null
  deliveryNote?: string | null
  updatedAt?: string | null
  deliveredAt?: string | null
  completedAt?: string | null
}

type Profile = {
  fullName?: string | null
  phone?: string | null
  address?: string | null
}

type OfferForm = {
  offerPrice: string
  recyclerContactName: string
  recyclerContactPhone: string
  recyclerDeliveryAddress: string
  offerNote: string
}

const EMPTY_OFFER: OfferForm = {
  offerPrice: "",
  recyclerContactName: "",
  recyclerContactPhone: "",
  recyclerDeliveryAddress: "",
  offerNote: "",
}

export default function RecyclerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [batches, setBatches] = useState<Batch[]>([])
  const [myBatches, setMyBatches] = useState<Batch[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [offerForm, setOfferForm] = useState<OfferForm>(EMPTY_OFFER)
  const [tab, setTab] = useState<"available" | "offers" | "shipping" | "history">("available")
  const role = String(session?.user?.role || "").toUpperCase()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [available, purchases, profileData] = await Promise.all([
      fetch("/api/batches/available").then((response) => response.json()),
      fetch("/api/batches/my-purchases").then((response) => response.json()),
      fetch("/api/profile").then((response) => response.json()),
    ])

    setBatches(available.batches || [])
    setMyBatches(purchases.batches || [])
    setProfile(profileData.profile || null)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated" && role !== "RECYCLER") router.replace(role === "HOUSEHOLD" ? "/household" : role === "COLLECTOR" ? "/collector" : "/admin")
  }, [status, role, router])

  useEffect(() => {
    if (status === "authenticated" && role === "RECYCLER") void Promise.resolve().then(fetchData)
  }, [status, role, fetchData])

  function openOfferForm(batch: Batch) {
    setSelectedBatch(batch)
    setOfferForm({
      offerPrice: String(Math.round(Number(batch.pricePerKg) * Number(batch.totalWeight) || 0)),
      recyclerContactName: profile?.fullName || session?.user?.name || "",
      recyclerContactPhone: profile?.phone || "",
      recyclerDeliveryAddress: profile?.address || "",
      offerNote: "",
    })
  }

  async function submitOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedBatch) return

    const response = await fetch(`/api/batches/${selectedBatch.id}/offer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...offerForm,
        offerPrice: Number(offerForm.offerPrice),
      }),
    })
    const data = await response.json().catch(() => ({}))
    if (response.ok) {
      setSelectedBatch(null)
      setOfferForm(EMPTY_OFFER)
      await fetchData()
      setTab("offers")
      alert("Penawaran berhasil dikirim")
    } else {
      alert(data.error || "Penawaran tidak dapat dikirim")
    }
  }

  async function acceptCounter(batchId: string) {
    const response = await fetch(`/api/batches/${batchId}/accept-counter`, { method: "POST" })
    const data = await response.json().catch(() => ({}))
    if (response.ok) void fetchData()
    else alert(data.error || "Harga collector tidak dapat diterima")
  }

  async function cancelOffer(batchId: string) {
    const response = await fetch(`/api/batches/${batchId}/cancel`, { method: "POST" })
    const data = await response.json().catch(() => ({}))
    if (response.ok) void fetchData()
    else alert(data.error || "Penawaran tidak dapat dibatalkan")
  }

  async function updateBatch(batchId: string, endpoint: string, body?: object) {
    const response = await fetch(`/api/batches/${batchId}/${endpoint}`, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await response.json().catch(() => ({}))
    if (response.ok) void fetchData()
    else alert(data.error || "Status batch tidak dapat diperbarui")
  }

  if (status !== "authenticated" || role !== "RECYCLER") return <div className="page-loader">Memeriksa akses...</div>

  const availableBatches = batches.filter((batch) => normalizeBatchStatus(batch.status) === "AVAILABLE")
  const offerBatches = myBatches.filter((batch) => ["OFFER_SUBMITTED", "COUNTER_OFFERED"].includes(normalizeBatchStatus(batch.status)))
  const shippingBatches = myBatches.filter((batch) => ["APPROVED", "IN_DELIVERY", "DELIVERED"].includes(normalizeBatchStatus(batch.status)))
  const historyBatches = myBatches.filter((batch) => ["COMPLETED", "REJECTED", "CANCELLED"].includes(normalizeBatchStatus(batch.status)))
  const totalBought = myBatches.reduce((total, batch) => total + Number(batch.totalWeight || 0), 0)

  return (
    <main className="app-page">
      <section className="role-hero">
        <Navbar userName={session?.user?.name || ""} role="RECYCLER" />
        <div className="role-hero-content">
          <span className="section-kicker">Dashboard Recycler</span>
          <h1>Selamat datang, {session.user.name?.split(" ")[0]}. Beli batch material daur ulang dari pengepul terverifikasi.</h1>
          <p>Recycler mengajukan penawaran, menunggu counter offer, lalu menerima material setelah collector mengirim ke alamat tujuan.</p>
          <button className="light-btn" type="button" onClick={() => setTab("available")}>Cari Batch Material</button>
        </div>
      </section>

      <section className="role-dashboard-shell">
        <div className="role-stat-grid role-stat-grid-four">
          <article className="stat-card"><small>Batch Tersedia</small><strong>{availableBatches.length}</strong><span>siap ditawar</span></article>
          <article className="stat-card"><small>Penawaran Saya</small><strong>{offerBatches.length}</strong><span>menunggu respon</span></article>
          <article className="stat-card"><small>Pembelian Aktif</small><strong>{shippingBatches.length}</strong><span>dalam proses</span></article>
          <article className="stat-card"><small>Total Material</small><strong>{totalBought.toFixed(1)}</strong><span>kg material dibeli</span></article>
        </div>

        <div className="role-info-card">
          <strong>Recycler besar aktif di kota</strong>
          <span>PasarCuan tetap fitur tambahan. Flow inti di sini adalah penawaran batch material dari collector ke recycler.</span>
          <button className="outline-btn" type="button" onClick={() => router.push("/bid")}>Buka PasarCuan</button>
        </div>

        <section className="content-card role-workspace">
          <div className="tab-list">
            <button className={tab === "available" ? "active" : ""} type="button" onClick={() => setTab("available")}>Batch Tersedia <span>{availableBatches.length}</span></button>
            <button className={tab === "offers" ? "active" : ""} type="button" onClick={() => setTab("offers")}>Penawaran Saya <span>{offerBatches.length}</span></button>
            <button className={tab === "shipping" ? "active" : ""} type="button" onClick={() => setTab("shipping")}>Menunggu Pengiriman <span>{shippingBatches.length}</span></button>
            <button className={tab === "history" ? "active" : ""} type="button" onClick={() => setTab("history")}>Riwayat Pembelian <span>{historyBatches.length}</span></button>
          </div>

          {loading ? (
            <div className="empty-state"><p>Memuat data...</p></div>
          ) : tab === "available" ? (
            <>
              {selectedBatch && <OfferFormCard batch={selectedBatch} form={offerForm} setForm={setOfferForm} onSubmit={submitOffer} onClose={() => setSelectedBatch(null)} profile={profile} />}
              {availableBatches.length ? availableBatches.map((batch) => (
                <BatchListItem
                  key={batch.id}
                  batch={batch}
                  primaryActionLabel="Ajukan Penawaran"
                  onPrimaryAction={() => openOfferForm(batch)}
                  onDetailAction={() => openOfferForm(batch)}
                />
              )) : <EmptyState title="Belum ada batch material" text="Batch akan muncul setelah pengepul terverifikasi menyelesaikan pickup dan membuat batch material." />}
            </>
          ) : tab === "offers" ? (
            offerBatches.length ? offerBatches.map((batch) => (
              <article className="pickup-action-card collector-batch-card" key={batch.id}>
                <div className="collector-pickup-main">
                  <div className="data-row-copy">
                    <span className="data-eyebrow">{batch.wasteType}</span>
                    <h3>{batch.totalWeight} kg material - grade {batch.grade || "B"}</h3>
                    <p>Dari {batch.collectorName || "Pengepul terverifikasi"} {batch.location ? `- ${batch.location}` : ""}</p>
                    <p>Harga tawar saya: Rp {Number(batch.offerPrice || 0).toLocaleString("id-ID")}</p>
                    {normalizeBatchStatus(batch.status) === "COUNTER_OFFERED" && <p>Harga balik collector: Rp {Number(batch.counterPrice || 0).toLocaleString("id-ID")}</p>}
                    {batch.offerNote && <p>Catatan saya: {batch.offerNote}</p>}
                    {batch.counterNote && <p>Catatan collector: {batch.counterNote}</p>}
                  </div>
                  <div className="row-actions collector-pickup-actions">
                    {normalizeBatchStatus(batch.status) === "COUNTER_OFFERED" ? (
                      <>
                        <button className="outline-btn" type="button" onClick={() => void cancelOffer(batch.id)}>Batalkan</button>
                        <button className="green-small-btn" type="button" onClick={() => void acceptCounter(batch.id)}>Terima Harga Collector</button>
                      </>
                    ) : (
                      <span className={`status-pill ${getBatchStatus(batch.status).tone}`}>{getBatchStatusLabel(batch.status)}</span>
                    )}
                    {batch.collectorPhone && <a className="outline-btn" href={`tel:${batch.collectorPhone}`}>Hubungi Pengepul</a>}
                  </div>
                </div>
                <BatchPurchaseTimeline compact status={batch.status || "OFFER_SUBMITTED"} updatedAt={batch.updatedAt || undefined} agreedPrice={batch.agreedPrice || batch.counterPrice || batch.offerPrice} platformFee={batch.platformFee} collectorEarning={batch.collectorEarning} />
              </article>
            )) : <EmptyState title="Belum ada penawaran" text="Penawaran yang kamu ajukan akan tampil di sini." />
          ) : tab === "shipping" ? (
            shippingBatches.length ? shippingBatches.map((batch) => (
              <article className="pickup-action-card collector-batch-card" key={batch.id}>
                <div className="collector-pickup-main">
                  <div className="data-row-copy">
                    <span className="data-eyebrow">{batch.wasteType}</span>
                    <h3>{batch.totalWeight} kg material - {batch.collectorName || "Pengepul"}</h3>
                    <p>Alamat pengiriman: {batch.recyclerDeliveryAddress || profile?.address || "Alamat belum dicantumkan"}</p>
                    <p>Nomor kontak: {batch.recyclerContactPhone || profile?.phone || "Nomor belum tersedia"}</p>
                    {(() => {
                      const finance = resolveBatchFinance({
                        agreedPrice: batch.agreedPrice,
                        counterPrice: batch.counterPrice,
                        offerPrice: batch.offerPrice,
                        pricePerKg: batch.pricePerKg,
                        totalWeight: batch.totalWeight,
                      })
                      return finance.agreedPrice > 0 ? (
                        <>
                          <p>Harga deal: Rp {finance.agreedPrice.toLocaleString("id-ID")}</p>
                          <p>Platform fee 5%: Rp {finance.platformFee.toLocaleString("id-ID")}</p>
                          <p>Pendapatan collector: Rp {finance.collectorEarning.toLocaleString("id-ID")}</p>
                        </>
                      ) : (
                        <p>Harga belum disepakati</p>
                      )
                    })()}
                  </div>
                  <div className="row-actions collector-pickup-actions">
                    {batch.recyclerContactPhone && <a className="outline-btn" href={`tel:${batch.recyclerContactPhone}`}>Hubungi Recycler</a>}
                    {normalizeBatchStatus(batch.status) === "APPROVED" ? (
                      <button className="green-small-btn" type="button" onClick={() => void updateBatch(batch.id, "ship")}>Kirim Material</button>
                    ) : normalizeBatchStatus(batch.status) === "IN_DELIVERY" ? (
                      <button className="green-small-btn" type="button" onClick={() => void updateBatch(batch.id, "deliver", { deliveryNote: batch.deliveryNote || "" })}>Material Sudah Diserahkan</button>
                    ) : normalizeBatchStatus(batch.status) === "DELIVERED" ? (
                      <button className="green-small-btn" type="button" onClick={() => void updateBatch(batch.id, "confirm")}>Konfirmasi Material Diterima</button>
                    ) : null}
                  </div>
                </div>
                {(() => {
                  const finance = resolveBatchFinance({
                    agreedPrice: batch.agreedPrice,
                    counterPrice: batch.counterPrice,
                    offerPrice: batch.offerPrice,
                    pricePerKg: batch.pricePerKg,
                    totalWeight: batch.totalWeight,
                  })
                  return (
                    <BatchPurchaseTimeline
                      compact
                      status={batch.status || "APPROVED"}
                      updatedAt={batch.updatedAt || undefined}
                      agreedPrice={finance.agreedPrice}
                      platformFee={finance.platformFee}
                      collectorEarning={finance.collectorEarning}
                    />
                  )
                })()}
              </article>
            )) : <EmptyState title="Belum ada pembelian aktif" text="Pembelian yang disetujui pengepul akan tampil di sini." />
          ) : historyBatches.length ? historyBatches.map((batch) => (
            <article className="pickup-action-card collector-batch-card" key={batch.id}>
              <div className="collector-pickup-main">
                <div className="data-row-copy">
                  <span className="data-eyebrow">{batch.wasteType}</span>
                  <h3>{batch.totalWeight} kg material</h3>
                  <p>Dari {batch.collectorName || "Pengepul"} {batch.location ? `- ${batch.location}` : ""}</p>
                  <p>Status: {getBatchStatusLabel(batch.status)}</p>
                </div>
                <span className={`status-pill ${getBatchStatus(batch.status).tone}`}>{getBatchStatusLabel(batch.status)}</span>
              </div>
              {(() => {
                const finance = resolveBatchFinance({
                  agreedPrice: batch.agreedPrice,
                  counterPrice: batch.counterPrice,
                  offerPrice: batch.offerPrice,
                  pricePerKg: batch.pricePerKg,
                  totalWeight: batch.totalWeight,
                })
                return (
                  <BatchPurchaseTimeline
                    compact
                    status={batch.status || "COMPLETED"}
                    updatedAt={batch.updatedAt || undefined}
                    agreedPrice={finance.agreedPrice}
                    platformFee={finance.platformFee}
                    collectorEarning={finance.collectorEarning}
                  />
                )
              })()}
            </article>
          )) : <EmptyState title="Belum ada riwayat pembelian" text="Transaksi yang selesai atau dibatalkan akan tersimpan di sini." />}
        </section>
      </section>
    </main>
  )
}

function OfferFormCard({
  batch,
  form,
  setForm,
  onSubmit,
  onClose,
  profile,
}: {
  batch: Batch
  form: OfferForm
  setForm: (value: OfferForm | ((current: OfferForm) => OfferForm)) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onClose: () => void
  profile: Profile | null
}) {
  return (
    <article className="pickup-action-card collector-batch-card">
      <div className="collector-pickup-main">
        <div className="data-row-copy">
          <span className="data-eyebrow">Ajukan Penawaran</span>
          <h3>{batch.wasteType} - {batch.totalWeight} kg - grade {batch.grade || "B"}</h3>
          <p>Dari {batch.collectorName || "Pengepul terverifikasi"} {batch.location ? `- ${batch.location}` : ""}</p>
          <p>Harga referensi: Rp {Number(batch.pricePerKg).toLocaleString("id-ID")}/kg</p>
          <p>Nama kontak default: {profile?.fullName || "Belum diisi"}</p>
          <p>Nomor kontak default: {profile?.phone || "Belum diisi"}</p>
          <p>Alamat gudang default: {profile?.address || "Belum diisi"}</p>
        </div>
        <button className="outline-btn" type="button" onClick={onClose}>Tutup</button>
      </div>

      <form className="offer-form-grid" onSubmit={onSubmit}>
        <label>
          Harga tawar recycler
          <input type="number" min="1" value={form.offerPrice} onChange={(event) => setForm((current) => ({ ...current, offerPrice: event.target.value }))} />
        </label>
        <label>
          Nama kontak recycler
          <input type="text" value={form.recyclerContactName} onChange={(event) => setForm((current) => ({ ...current, recyclerContactName: event.target.value }))} />
        </label>
        <label>
          Nomor kontak recycler
          <input type="text" value={form.recyclerContactPhone} onChange={(event) => setForm((current) => ({ ...current, recyclerContactPhone: event.target.value }))} />
        </label>
        <label className="offer-form-wide">
          Alamat pengiriman recycler
          <textarea value={form.recyclerDeliveryAddress} onChange={(event) => setForm((current) => ({ ...current, recyclerDeliveryAddress: event.target.value }))} rows={2} />
        </label>
        <label className="offer-form-wide">
          Catatan pembelian
          <textarea value={form.offerNote} onChange={(event) => setForm((current) => ({ ...current, offerNote: event.target.value }))} rows={3} />
        </label>
        <div className="offer-form-actions offer-form-wide">
          <button className="green-small-btn" type="submit">Kirim Penawaran</button>
        </div>
      </form>
    </article>
  )
}

function BatchListItem({
  batch,
  primaryActionLabel,
  onPrimaryAction,
  onDetailAction,
}: {
  batch: Batch
  primaryActionLabel: string
  onPrimaryAction: () => void
  onDetailAction: () => void
}) {
  return (
    <article className="data-row">
      <div className="data-row-copy">
        <span className="data-eyebrow">{batch.wasteType}</span>
        <h3>{batch.totalWeight} kg material - grade {batch.grade || "B"}</h3>
        <p>Dari {batch.collectorName || "Pengepul terverifikasi"} {batch.location ? `- ${batch.location}` : ""}</p>
        <p>Harga referensi collector: Rp {Number(batch.pricePerKg).toLocaleString("id-ID")}/kg</p>
        {batch.description && <p>{batch.description}</p>}
      </div>
      <div className="row-actions">
        <button className="outline-btn" type="button" onClick={onDetailAction}>Lihat Detail</button>
        <button className="green-small-btn" type="button" onClick={onPrimaryAction}>{primaryActionLabel}</button>
      </div>
    </article>
  )
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><div className="empty-icon">+</div><h3>{title}</h3><p>{text}</p></div>
}
