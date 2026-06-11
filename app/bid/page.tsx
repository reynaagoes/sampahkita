"use client"

import Navbar from "@/components/Navbar"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

type Listing = {
  id: string
  title: string
  description?: string | null
  photoUrl?: string | null
  sellerName?: string | null
  currentPrice: number | string
  minPrice: number | string
  maxPrice: number | string
  priceStep: number | string
  bidCount?: number | null
  expiresAt?: string | null
  category?: string | null
  type?: string | null
  location?: string | null
}

const CATEGORIES = ["Semua", "Elektronik", "Plastik", "Kertas", "Logam", "Kaca", "Organik", "Lainnya"] as const

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  if (value && typeof value === "object" && "toString" in value) {
    const parsed = Number(value.toString())
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

function rupiah(value: unknown) {
  return "Rp " + toNumber(value).toLocaleString("id-ID")
}

function getCategory(item: Listing) {
  const explicit = item.category || item.type
  if (explicit && CATEGORIES.includes(explicit as (typeof CATEGORIES)[number])) return explicit

  const text = `${item.title} ${item.description || ""}`.toLowerCase()
  if (/(hp|smartphone|laptop|charger|elektronik|phone|samsung|redmi)/.test(text)) return "Elektronik"
  if (/(plastik|botol pet|pet|galon)/.test(text)) return "Plastik"
  if (/(kertas|kardus|buku|box|dus)/.test(text)) return "Kertas"
  if (/(logam|aluminium|besi|tembaga|kaleng)/.test(text)) return "Logam"
  if (/(kaca|botol kaca|gelas)/.test(text)) return "Kaca"
  if (/(organik|kompos|daun|sisa makanan)/.test(text)) return "Organik"
  return "Lainnya"
}

function getInitial(category: string) {
  const map: Record<string, string> = {
    Semua: "SM",
    Elektronik: "EL",
    Plastik: "PL",
    Kertas: "KT",
    Logam: "LG",
    Kaca: "KC",
    Organik: "OR",
    Lainnya: "LN",
  }
  return map[category] || "CS"
}

function getTimeLeft(expiresAt?: string | null) {
  if (!expiresAt) return "fleksibel"
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return "selesai"
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `${days}h ${hours}j`
  return `${hours}j`
}

export default function BidPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Semua")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/bid")
      .then((response) => response.json())
      .then((data) => setListings(data.listings || []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false))
  }, [status])

  async function placeBid(listingId: string) {
    const res = await fetch("/api/bid/" + listingId, { method: "POST" })
    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      alert("Bid berhasil. Harga sekarang: " + rupiah(data.newPrice || 0))
      const refreshed = await fetch("/api/bid").then((response) => response.json()).catch(() => ({ listings: [] }))
      setListings(refreshed.listings || [])
    } else {
      alert(data.error || "Bid gagal")
    }
  }

  const visibleListings = useMemo(() => {
    const query = search.trim().toLowerCase()
    return listings.filter((item) => {
      const itemCategory = getCategory(item)
      const matchSearch = !query || item.title.toLowerCase().includes(query) || itemCategory.toLowerCase().includes(query)
      const matchCategory = category === "Semua" || itemCategory === category
      return matchSearch && matchCategory
    })
  }, [listings, search, category])

  if (status === "loading") return <div className="page-loader">Memuat PasarCuan...</div>

  return (
    <main className="app-page market-page">
      <Navbar userName={session?.user?.name || ""} role={session?.user?.role} />

      <section className="market-hero">
        <div>
          <span className="section-kicker">Fitur tambahan</span>
          <h1>PasarCuan</h1>
          <p>Jual barang layak pakai atau material daur ulang. Fitur ini melengkapi layanan penjemputan sampah.</p>
        </div>
        <div className="market-hero-note">
          <strong>Penjemputan sampah gratis tetap menjadi layanan utama.</strong>
          <span>Masih butuh penjemputan sampah?</span>
          {session?.user?.role === "HOUSEHOLD" && <button type="button" onClick={() => router.push("/household/request/new")}>Ajukan Penjemputan Gratis</button>}
        </div>
      </section>

      <section className="market-toolbar classic-panel">
        <label className="market-search">
          <span>Cari</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari barang, kategori, atau penjual..." />
        </label>
        <button className="green-small-btn" type="button" onClick={() => router.push("/bid/new")}>+ Jual Barang</button>
      </section>

      <section className="category-tabs">
        {CATEGORIES.map((item) => (
          <button key={item} type="button" className={category === item ? "active" : ""} onClick={() => setCategory(item)}>
            <span>{getInitial(item)}</span>
            {item}
          </button>
        ))}
      </section>

      {loading ? (
        <div className="empty-state classic-panel market-empty">
          <div className="empty-icon">...</div>
          <h3>Memuat barang...</h3>
          <p>Sistem sedang mengambil data PasarCuan.</p>
        </div>
      ) : visibleListings.length === 0 ? (
        <div className="empty-state classic-panel market-empty">
          <div className="empty-icon">+</div>
          <h3>Belum ada barang yang cocok</h3>
          <p>Ubah filter atau tambahkan barang pertamamu.</p>
        </div>
      ) : (
        <section className="market-grid">
          {visibleListings.map((item) => {
            const itemCategory = getCategory(item)
            const nextPrice = toNumber(item.currentPrice) + toNumber(item.priceStep)
            const isFull = nextPrice > toNumber(item.maxPrice)
            const isOwner = Boolean(session?.user?.name && item.sellerName === session.user.name)

            return (
              <article className="market-item-card" key={item.id} onClick={() => router.push("/bid/" + item.id)}>
                <div className="item-image">
                  {item.photoUrl ? <img src={item.photoUrl} alt={item.title} /> : <span>{getInitial(itemCategory)}</span>}
                  <small>{itemCategory}</small>
                </div>
                <div className="item-body">
                  <h2>{item.title}</h2>
                  <p>oleh {item.sellerName || "Pengguna CuanSampah"}</p>
                  <strong>{rupiah(item.currentPrice)}</strong>
                  <div className="item-meta">
                    <span>{toNumber(item.bidCount)} bid</span>
                    <span>Sisa {getTimeLeft(item.expiresAt)}</span>
                  </div>

                  {!isOwner && !isFull && (
                    <button
                      className="green-small-btn"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        void placeBid(item.id)
                      }}
                    >
                      Tawar Sekarang
                    </button>
                  )}

                  {isFull && <button className="soft-btn" type="button">Terjual</button>}
                  {isOwner && <button className="soft-btn" type="button">Listing milikmu</button>}
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
