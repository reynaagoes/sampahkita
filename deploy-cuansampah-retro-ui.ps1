# CuanSampah Retro Classic UI Patch
# Jalankan dari root repo: C:\Users\reyna\Documents\GitHub\sampahkita
# powershell -ExecutionPolicy Bypass -File .\deploy-cuansampah-retro-ui.ps1

$ErrorActionPreference = "Stop"

function Backup-File {
  param([string]$Path)
  if (Test-Path -LiteralPath $Path) {
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    Copy-Item -LiteralPath $Path -Destination "$Path.retro-ui-$stamp.bak" -Force
    Write-Host "Backup dibuat: $Path.retro-ui-$stamp.bak"
  }
}

function Ensure-Dir {
  param([string]$Path)
  if (!(Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

Backup-File "app/layout.tsx"
Backup-File "app/globals.css"
Backup-File "components/Navbar.tsx"
Backup-File "app/(auth)/login/page.tsx"
Backup-File "app/(dashboard)/household/page.tsx"
Backup-File "app/bid/page.tsx"

Ensure-Dir "components"
Ensure-Dir "app/(auth)/login"
Ensure-Dir "app/(dashboard)/household"
Ensure-Dir "app/bid"

Set-Content -LiteralPath "components/BrandLogo.tsx" -Encoding UTF8 -Value @'
import Link from "next/link"

type BrandLogoProps = {
  href?: string
  compact?: boolean
  dark?: boolean
  className?: string
}

export default function BrandLogo({ href = "/", compact = false, dark = false, className = "" }: BrandLogoProps) {
  const content = (
    <span className={`brand-logo ${dark ? "brand-logo-dark" : ""} ${compact ? "brand-logo-compact" : ""} ${className}`}>
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 64 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 15.2L20.2 5H46.3L56 13.4L45.1 23.4H19.4L8 15.2Z" fill="#18A84F" />
          <path d="M46.4 5H60L52.7 18.1L46.4 5Z" fill="#18A84F" />
          <path d="M56 29.1L43.8 39H17.7L8 30.6L18.9 20.6H44.6L56 29.1Z" fill="#0B172A" />
          <path d="M17.6 39H4L11.3 25.9L17.6 39Z" fill="#0B172A" />
          <path d="M21.5 22H42.5" stroke="#FFF7E6" strokeWidth="2.7" strokeLinecap="round" />
        </svg>
      </span>
      <span className="brand-text">
        <span>Cuan</span>
        <span>Sampah</span>
      </span>
    </span>
  )

  return href ? (
    <Link href={href} className="brand-logo-link" aria-label="CuanSampah">
      {content}
    </Link>
  ) : (
    content
  )
}
'@

Set-Content -LiteralPath "app/layout.tsx" -Encoding UTF8 -Value @'
import type { Metadata } from "next"
import { Lora, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
})

const lora = Lora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
})

export const metadata: Metadata = {
  title: "CuanSampah",
  description: "Gratis angkut sampah dari rumah, kumpulkan poin, dan ubah sampah jadi nilai.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={`${jakarta.variable} ${lora.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
'@

Set-Content -LiteralPath "components/Navbar.tsx" -Encoding UTF8 -Value @'
"use client"

import BrandLogo from "@/components/BrandLogo"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

type NavbarProps = {
  userName?: string | null
  role?: string | null
}

const ROLE_LABEL: Record<string, string> = {
  HOUSEHOLD: "Rumah Tangga",
  COLLECTOR: "Pengepul",
  RECYCLER: "Recycler",
  ADMIN: "Admin",
}

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="nav-icon" aria-hidden="true">
      <path d="M4 11.2 12 5l8 6.2V20a1 1 0 0 1-1 1h-4.4v-5.3H9.4V21H5a1 1 0 0 1-1-1v-8.8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

function IconShop() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="nav-icon" aria-hidden="true">
      <path d="M5 10h14v10H5V10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M4 4h16l1 6H3l1-6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 14h8M8 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="nav-icon" aria-hidden="true">
      <path d="M18 9a6 6 0 0 0-12 0c0 6-2.5 6.5-2.5 8h17c0-1.5-2.5-2-2.5-8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 20a2.1 2.1 0 0 0 4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="nav-icon" aria-hidden="true">
      <path d="M14 7V5.5A1.5 1.5 0 0 0 12.5 4h-6A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20h6a1.5 1.5 0 0 0 1.5-1.5V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 12h10m0 0-3-3m3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Navbar({ userName, role }: NavbarProps) {
  const pathname = usePathname()

  const dashboardPath =
    role === "COLLECTOR"
      ? "/collector"
      : role === "RECYCLER"
        ? "/recycler"
        : role === "ADMIN"
          ? "/admin"
          : "/household"

  const firstName = userName?.trim()?.split(" ")[0] || "JOO"

  return (
    <header className="app-navbar-shell">
      <nav className="app-navbar">
        <BrandLogo href={dashboardPath} />

        <div className="app-nav-links">
          <Link href={dashboardPath} className={`app-nav-link ${pathname === dashboardPath ? "active" : ""}`}>
            <IconHome />
            {ROLE_LABEL[role || ""] || "Dashboard"}
          </Link>
          <Link href="/bid" className={`app-nav-link ${pathname.startsWith("/bid") ? "active" : ""}`}>
            <IconShop />
            PasarCuan
          </Link>
        </div>

        <div className="app-nav-actions">
          <span className="app-greeting">Halo, <strong>{firstName}</strong></span>
          <button className="nav-square" type="button" aria-label="Notifikasi">
            <IconBell />
          </button>
          <button className="nav-logout" type="button" onClick={() => void signOut({ callbackUrl: "/login" })}>
            Keluar
            <IconLogout />
          </button>
        </div>
      </nav>
    </header>
  )
}
'@

Set-Content -LiteralPath "app/(auth)/login/page.tsx" -Encoding UTF8 -Value @'
"use client"

import BrandLogo from "@/components/BrandLogo"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")

    const res = await signIn("credentials", { email, password, redirect: false })

    if (res?.error) {
      setError("Email atau password salah")
      setLoading(false)
      return
    }

    const session = await fetch("/api/auth/session").then((response) => response.json())
    const role = session?.user?.role

    if (role === "HOUSEHOLD") router.push("/household")
    else if (role === "COLLECTOR") router.push("/collector")
    else if (role === "RECYCLER") router.push("/recycler")
    else if (role === "ADMIN") router.push("/admin")
    else router.push("/")
  }

  return (
    <main className="login-page">
      <nav className="login-nav">
        <BrandLogo href="/login" dark />
        <div className="login-nav-links">
          <a href="#beranda">Beranda</a>
          <a href="#cara-kerja">Cara Kerja</a>
          <a href="#dampak">Dampak</a>
          <Link href="/register" className="login-register-link">Daftar Gratis</Link>
        </div>
      </nav>

      <section className="login-hero" id="beranda">
        <div className="login-copy">
          <span className="retro-kicker">Platform Ekonomi Sirkular Indonesia</span>
          <h1>
            Gratis Angkut Sampah.
            <span>Kami datang ke rumahmu.</span>
          </h1>
          <p>
            CuanSampah membantu rumah tangga menjadwalkan penjemputan sampah gratis,
            mengumpulkan poin, dan memberi nilai lebih pada barang sisa.
          </p>

          <div className="login-feature-list">
            <div className="login-feature-card">
              <span className="classic-icon">TRK</span>
              <div>
                <strong>Angkut Sampah Gratis</strong>
                <small>Jadwalkan penjemputan dari rumah tanpa biaya.</small>
              </div>
            </div>
            <div className="login-feature-card">
              <span className="classic-icon gold">PTS</span>
              <div>
                <strong>Kumpulkan Poin</strong>
                <small>Setiap penjemputan memberi nilai dan dampak.</small>
              </div>
            </div>
            <div className="login-feature-card">
              <span className="classic-icon">PAS</span>
              <div>
                <strong>PasarCuan sebagai Tambahan</strong>
                <small>Jual barang layak pakai atau material daur ulang.</small>
              </div>
            </div>
          </div>

          <div className="login-stamp-row">
            <span className="stamp-box">Gratis Angkut di Rumahmu</span>
            <span className="stamp-note">Terdaftar dan diawasi komunitas untuk lingkungan Indonesia.</span>
          </div>
        </div>

        <div className="login-visual-panel">
          <div className="retro-scene">
            <div className="scene-sun" />
            <div className="scene-house">
              <div className="house-roof" />
              <div className="house-body">
                <span />
                <span />
              </div>
            </div>
            <div className="scene-truck">
              <div className="truck-box">CS</div>
              <div className="truck-cab" />
              <span className="wheel one" />
              <span className="wheel two" />
            </div>
            <div className="scene-person" />
            <div className="scene-bin">Cuan</div>
            <div className="paper-stamp">100% GRATIS</div>
          </div>

          <form className="login-card" onSubmit={handleSubmit}>
            <BrandLogo href="/login" compact />
            <div className="login-card-head">
              <h2>Masuk ke CuanSampah</h2>
              <p>Belum punya akun? <Link href="/register">Daftar gratis</Link></p>
            </div>

            {error && <div className="form-error">{error}</div>}

            <label className="form-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@email.com"
                required
              />
            </label>

            <label className="form-field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Masukkan password"
                required
              />
            </label>

            <button className="primary-classic-btn" type="submit" disabled={loading}>
              {loading ? "Memverifikasi..." : "Masuk"}
            </button>

            <div className="login-mini-links">
              <Link href="/forgot-password">Lupa password?</Link>
              <Link href="/register">Buat akun</Link>
            </div>
          </form>
        </div>
      </section>

      <section className="login-stats">
        <div><strong>5.2rb+</strong><span>poin terkumpul</span></div>
        <div><strong>1.2rb kg</strong><span>CO2 dicegah</span></div>
        <div><strong>248</strong><span>transaksi</span></div>
        <div><strong>3</strong><span>jenis pengguna</span></div>
      </section>
    </main>
  )
}
'@

Set-Content -LiteralPath "app/(dashboard)/household/page.tsx" -Encoding UTF8 -Value @'
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

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return

    Promise.all([
      fetch("/api/requests").then((response) => response.json()).catch(() => ({ requests: [] })),
      fetch("/api/points").then((response) => response.json()).catch(() => ({ total: 0 })),
    ]).then(([req, pt]) => {
      setRequests(req.requests || [])
      setPoints(pt.total || 0)
      setLoading(false)
    })
  }, [status])

  if (status === "loading" || loading) {
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
            <span className="retro-kicker">Dashboard Rumah Tangga</span>
            <h1>Selamat datang kembali, <span>{firstName}!</span></h1>
            <p>Kelola sampahmu, jadwalkan angkut gratis, lalu kumpulkan poin bersama CuanSampah.</p>
          </div>

          <div className="hero-house-illustration" aria-hidden="true">
            <div className="mini-house-roof" />
            <div className="mini-house-body" />
            <div className="mini-tree" />
            <div className="mini-recycle-badge">CS</div>
          </div>
        </section>
      </div>

      <section className="dashboard-container">
        <div className="pickup-banner">
          <div className="pickup-truck" aria-hidden="true">
            <div className="pickup-paper" />
            <div className="pickup-car">
              <span>CS</span>
            </div>
          </div>
          <div>
            <span className="free-label">GRATIS</span>
            <h2>Buat Request Angkut Gratis</h2>
            <p>Kami datang ke rumahmu. Cukup pilih jadwal dan jenis sampah.</p>
          </div>
          <button className="orange-btn" type="button" onClick={() => router.push("/household/request/new")}>
            + Buat Request Angkut Gratis
          </button>
          <div className="ticket-stamp" aria-hidden="true">100% GRATIS<br />DI RUMAHMU</div>
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
              <div className="empty-retro">
                <div className="empty-icon">TRK</div>
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
                        <h3>{item.wasteType || item.type || item.category || "Sampah Rumah Tangga"}</h3>
                        <p>{item.address || "Alamat penjemputan tersimpan"}</p>
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
              <div className="earth-illustration" aria-hidden="true">CS</div>
              <ul>
                <li><span>Sampah terkumpul</span><strong>{totalWeight.toFixed(1)} kg</strong></li>
                <li><span>CO2 dicegah</span><strong>{co2} kg</strong></li>
                <li><span>Transaksi</span><strong>{requests.length}</strong></li>
              </ul>
            </div>

            <div className="classic-panel quick-actions">
              <h2>Aksi Cepat</h2>
              <button type="button" onClick={() => router.push("/household/request/new")}>Buat Penjemputan</button>
              <button type="button" onClick={() => router.push("/bid")}>Buka PasarCuan</button>
              <button type="button">Panduan Pilah Sampah</button>
            </div>
          </aside>
        </section>

        <section className="classic-footer-note">
          <span>Bersama membangun Indonesia sirkular.</span>
        </section>
      </section>
    </main>
  )
}
'@

Set-Content -LiteralPath "app/bid/page.tsx" -Encoding UTF8 -Value @'
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
    <main className="app-page market-page-classic">
      <Navbar userName={session?.user?.name || ""} role="HOUSEHOLD" />

      <section className="market-classic-hero">
        <div>
          <span className="retro-kicker">Fitur Pendukung</span>
          <h1>PasarCuan</h1>
          <p>Jual barang layak pakai atau material daur ulang. Fokus utama tetap gratis angkut sampah dari rumah.</p>
        </div>
        <div className="market-stall" aria-hidden="true">
          <div className="stall-roof" />
          <div className="stall-table">
            <span>BOTOL</span>
            <span>BOX</span>
            <span>BESI</span>
          </div>
        </div>
      </section>

      <section className="market-toolbar classic-panel">
        <label className="classic-search">
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

      <section className="market-support-note">
        <div>
          <h2>PasarCuan hadir sebagai tambahan.</h2>
          <p>Utamakan layanan angkut sampah gratis. PasarCuan membantu memberi nilai lebih pada barang yang masih layak.</p>
        </div>
        <button type="button" onClick={() => router.push("/household/request/new")}>Request Angkut Gratis</button>
      </section>

      {loading ? (
        <div className="empty-retro classic-panel">
          <div className="empty-icon">LOAD</div>
          <h3>Memuat barang...</h3>
          <p>Sistem sedang mengambil data PasarCuan.</p>
        </div>
      ) : visibleListings.length === 0 ? (
        <div className="empty-retro classic-panel">
          <div className="empty-icon">CS</div>
          <h3>Belum ada barang yang cocok</h3>
          <p>Ubah filter atau tambahkan barang pertamamu.</p>
        </div>
      ) : (
        <section className="market-grid-classic">
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
                      Bid Sekarang
                    </button>
                  )}

                  {isFull && <button className="soft-btn" type="button">Terjual</button>}
                  {isOwner && <button className="soft-btn" type="button">Listing kamu</button>}
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
'@

Set-Content -LiteralPath "app/globals.css" -Encoding UTF8 -Value @'
:root {
  --green-950: #0b3518;
  --green-900: #0f3d1c;
  --green-800: #165428;
  --green-700: #1d6b36;
  --green-600: #159447;
  --green-500: #22c55e;
  --cream: #f7f1df;
  --cream-2: #fff8e8;
  --paper: #fbf4df;
  --paper-line: #dfd2b1;
  --ink: #112033;
  --muted: #687386;
  --gold: #c7a23d;
  --terracotta: #c76c4a;
  --white: #ffffff;
  --shadow: 0 18px 45px rgba(31, 41, 55, 0.1);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  color: var(--ink);
  background: #f7f7f5;
  font-family: var(--font-body), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button,
input,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

a {
  color: inherit;
  text-decoration: none;
}

.page-loader {
  min-height: 100vh;
  display: grid;
  place-items: center;
  color: var(--muted);
  font-weight: 800;
}

.brand-logo-link {
  display: inline-flex;
}

.brand-logo {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.brand-mark {
  width: 54px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(15, 61, 28, 0.12);
  box-shadow: 0 12px 28px rgba(16, 75, 36, 0.12);
}

.brand-mark svg {
  width: 42px;
  height: 30px;
}

.brand-text {
  display: inline-flex;
  align-items: baseline;
  font-size: 25px;
  font-weight: 900;
  letter-spacing: -0.06em;
  color: var(--ink);
}

.brand-text span:last-child {
  color: var(--green-600);
}

.brand-logo-dark .brand-text {
  color: #fff;
}

.brand-logo-compact .brand-mark {
  width: 42px;
  height: 34px;
  border-radius: 12px;
}

.brand-logo-compact .brand-mark svg {
  width: 34px;
}

.brand-logo-compact .brand-text {
  font-size: 18px;
}

/* LOGIN */

.login-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at 20% 85%, rgba(199, 162, 61, 0.12), transparent 32%),
    linear-gradient(180deg, var(--green-950), var(--green-900));
  color: #fff;
}

.login-nav {
  height: 76px;
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.login-nav-links {
  display: flex;
  align-items: center;
  gap: 28px;
  color: #c7f6d6;
  font-size: 14px;
  font-weight: 700;
}

.login-register-link {
  padding: 12px 22px;
  border-radius: 12px;
  color: #fff;
  background: var(--green-500);
}

.login-hero {
  max-width: 1180px;
  min-height: calc(100vh - 150px);
  margin: 0 auto;
  padding: 36px 28px 48px;
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 44px;
  align-items: center;
}

.retro-kicker {
  display: inline-flex;
  padding: 7px 14px;
  border: 1px solid rgba(134, 239, 172, 0.38);
  border-radius: 999px;
  color: #8af3a8;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 12px;
  font-weight: 900;
}

.login-copy h1,
.household-hero h1,
.market-classic-hero h1 {
  font-family: var(--font-display), Georgia, serif;
}

.login-copy h1 {
  margin: 22px 0 16px;
  font-size: clamp(46px, 6vw, 76px);
  line-height: 0.94;
  letter-spacing: -0.055em;
}

.login-copy h1 span {
  display: block;
  color: var(--green-500);
}

.login-copy p {
  max-width: 560px;
  color: #97a6b8;
  font-size: 17px;
  line-height: 1.8;
  margin: 0 0 26px;
}

.login-feature-list {
  display: grid;
  gap: 12px;
}

.login-feature-card {
  display: flex;
  align-items: center;
  gap: 14px;
  max-width: 510px;
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.045);
  border-radius: 16px;
}

.classic-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 14px;
  color: #b7ffd0;
  background: rgba(34, 197, 94, 0.14);
  border: 1px solid rgba(134, 239, 172, 0.22);
  font-size: 11px;
  font-weight: 900;
}

.classic-icon.gold {
  color: #ffeba8;
  background: rgba(199, 162, 61, 0.18);
}

.login-feature-card strong {
  display: block;
  color: #fff;
  font-size: 15px;
  margin-bottom: 3px;
}

.login-feature-card small {
  display: block;
  color: #9aa8b8;
  font-size: 12px;
}

.login-stamp-row {
  max-width: 510px;
  margin-top: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.stamp-box {
  border: 1px dashed rgba(247, 241, 223, 0.45);
  color: #ffe7aa;
  border-radius: 12px;
  padding: 10px 13px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 11px;
}

.stamp-note {
  color: #96a4b3;
  font-size: 12px;
  line-height: 1.5;
}

.login-visual-panel {
  position: relative;
  min-height: 620px;
  border-radius: 28px;
  background:
    radial-gradient(circle at 20% 18%, rgba(34, 197, 94, 0.18), transparent 25%),
    linear-gradient(135deg, #fff8e8, #f4e9c9);
  color: var(--ink);
  padding: 28px;
  box-shadow: var(--shadow);
  overflow: hidden;
}

.retro-scene {
  position: absolute;
  inset: 24px;
}

.scene-sun {
  position: absolute;
  right: 130px;
  top: 30px;
  width: 86px;
  height: 86px;
  border-radius: 50%;
  background: #edd696;
  opacity: 0.45;
}

.scene-house {
  position: absolute;
  right: 110px;
  top: 145px;
  width: 190px;
  height: 150px;
}

.house-roof {
  width: 200px;
  height: 70px;
  clip-path: polygon(50% 0, 100% 70%, 0 70%);
  background: #b96b35;
}

.house-body {
  margin: -4px auto 0;
  width: 150px;
  height: 96px;
  background: #f2ddb4;
  border: 2px solid #c9ac7d;
  display: flex;
  gap: 18px;
  justify-content: center;
  align-items: center;
}

.house-body span {
  width: 32px;
  height: 38px;
  background: #a8bf8b;
  border: 2px solid #496a3c;
}

.scene-truck {
  position: absolute;
  right: 210px;
  bottom: 130px;
  width: 230px;
  height: 98px;
}

.truck-box {
  position: absolute;
  left: 0;
  bottom: 20px;
  width: 150px;
  height: 78px;
  display: grid;
  place-items: center;
  background: #2c6d3a;
  border-radius: 16px 8px 8px 16px;
  color: #e3f6da;
  font-weight: 900;
  font-size: 30px;
}

.truck-cab {
  position: absolute;
  left: 134px;
  bottom: 20px;
  width: 72px;
  height: 60px;
  background: #3f7d48;
  border-radius: 8px 18px 8px 8px;
}

.wheel {
  position: absolute;
  bottom: 0;
  width: 34px;
  height: 34px;
  background: #1d252f;
  border-radius: 50%;
  border: 6px solid #4b5563;
}

.wheel.one {
  left: 36px;
}

.wheel.two {
  left: 148px;
}

.scene-person {
  position: absolute;
  right: 108px;
  bottom: 110px;
  width: 42px;
  height: 112px;
  border-radius: 25px 25px 8px 8px;
  background: linear-gradient(#2d7a3c 0 34%, #1d3f28 34% 100%);
}

.scene-bin {
  position: absolute;
  right: 36px;
  bottom: 84px;
  width: 80px;
  height: 120px;
  display: grid;
  place-items: center;
  color: #e8f5df;
  font-weight: 900;
  background: #2d7a3c;
  border-radius: 12px;
  transform: rotate(-5deg);
}

.paper-stamp {
  position: absolute;
  right: 22px;
  top: 64px;
  width: 120px;
  height: 120px;
  display: grid;
  place-items: center;
  text-align: center;
  color: var(--green-900);
  border: 3px solid var(--green-700);
  border-radius: 50%;
  font-weight: 900;
  font-family: var(--font-display), Georgia, serif;
  transform: rotate(-12deg);
  background: rgba(255, 248, 232, 0.8);
}

.login-card {
  position: absolute;
  right: 32px;
  bottom: 32px;
  width: min(390px, calc(100% - 64px));
  padding: 26px;
  border-radius: 22px;
  background: rgba(255, 252, 242, 0.96);
  border: 1px solid #eadcbb;
  box-shadow: 0 24px 55px rgba(38, 28, 12, 0.18);
}

.login-card-head h2 {
  margin: 18px 0 4px;
  font-size: 25px;
  color: var(--ink);
}

.login-card-head p {
  margin: 0 0 20px;
  color: var(--muted);
  font-size: 14px;
}

.login-card-head a,
.login-mini-links a {
  color: var(--green-700);
  font-weight: 900;
}

.form-error {
  margin-bottom: 14px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 13px;
  font-weight: 700;
}

.form-field {
  display: block;
  margin-bottom: 14px;
}

.form-field span {
  display: block;
  margin-bottom: 7px;
  color: #263449;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.form-field input,
.classic-search input {
  width: 100%;
  border: 1px solid #e0d2b3;
  border-radius: 13px;
  padding: 13px 14px;
  background: #fffdf6;
  color: var(--ink);
  outline: none;
}

.primary-classic-btn,
.orange-btn,
.green-small-btn,
.soft-btn {
  border: 0;
  border-radius: 13px;
  font-weight: 900;
}

.primary-classic-btn {
  width: 100%;
  padding: 14px 16px;
  color: #fff;
  background: var(--green-900);
}

.primary-classic-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-mini-links {
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.login-stats {
  max-width: 1180px;
  margin: 0 auto;
  padding: 20px 28px 30px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 22px;
}

.login-stats div {
  padding: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.login-stats strong {
  display: block;
  color: var(--green-500);
  font-size: 24px;
}

.login-stats span {
  display: block;
  color: #8d9aaa;
  font-size: 12px;
}

/* APP NAV + SHARED */

.app-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at 10% 0%, rgba(199, 162, 61, 0.08), transparent 28%),
    linear-gradient(180deg, #fffaf0, #f7f1df);
}

.app-navbar-shell {
  padding: 26px 28px 0;
}

.app-navbar {
  max-width: 1380px;
  height: 74px;
  margin: 0 auto;
  padding: 0 22px;
  display: flex;
  align-items: center;
  gap: 26px;
  border: 1px solid #e7dcc0;
  border-radius: 24px;
  background: rgba(255, 252, 242, 0.94);
  box-shadow: 0 12px 30px rgba(25, 45, 25, 0.08);
}

.app-nav-links {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-nav-link {
  height: 48px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 0 18px;
  border-radius: 16px;
  color: #4b5c70;
  font-size: 14px;
  font-weight: 900;
}

.app-nav-link.active {
  color: var(--green-700);
  background: #ecf8ee;
  box-shadow: inset 0 -3px 0 var(--green-600);
}

.nav-icon {
  width: 20px;
  height: 20px;
}

.app-nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-greeting {
  color: #4b5c70;
  font-size: 14px;
  font-weight: 700;
}

.app-greeting strong {
  color: var(--green-700);
}

.nav-square,
.nav-logout {
  height: 46px;
  border: 1px solid #e7dcc0;
  background: #fffdf6;
  color: #263449;
  border-radius: 16px;
}

.nav-square {
  width: 46px;
  display: grid;
  place-items: center;
}

.nav-logout {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 18px;
  font-weight: 900;
}

/* HOUSEHOLD DASHBOARD */

.dashboard-top {
  background:
    radial-gradient(circle at 70% 20%, rgba(34, 197, 94, 0.12), transparent 30%),
    linear-gradient(180deg, var(--green-950), var(--green-900));
  padding-bottom: 160px;
}

.household-hero {
  max-width: 980px;
  margin: 30px auto 0;
  padding: 0 28px;
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 28px;
  align-items: center;
  color: #fff;
}

.household-hero h1 {
  margin: 18px 0 8px;
  font-size: 38px;
  line-height: 1;
}

.household-hero h1 span {
  color: #b6f5c9;
}

.household-hero p {
  margin: 0;
  color: #98a8b9;
}

.hero-house-illustration {
  position: relative;
  height: 170px;
  border-radius: 22px;
  background: rgba(255, 248, 232, 0.08);
  border: 1px solid rgba(255, 248, 232, 0.12);
  overflow: hidden;
}

.mini-house-roof {
  position: absolute;
  left: 85px;
  top: 38px;
  width: 140px;
  height: 60px;
  background: #b86b36;
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
}

.mini-house-body {
  position: absolute;
  left: 106px;
  top: 86px;
  width: 98px;
  height: 66px;
  background: #ead8b6;
  border-radius: 8px;
}

.mini-tree {
  position: absolute;
  right: 60px;
  bottom: 20px;
  width: 50px;
  height: 84px;
  background: #244f2d;
  border-radius: 30px 30px 6px 6px;
}

.mini-recycle-badge {
  position: absolute;
  right: 116px;
  bottom: 34px;
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #fff8e8;
  color: var(--green-800);
  font-weight: 900;
  border: 3px solid #d7c294;
}

.dashboard-container {
  max-width: 980px;
  margin: -120px auto 0;
  padding: 0 28px 44px;
  position: relative;
  z-index: 2;
}

.pickup-banner {
  position: relative;
  min-height: 150px;
  padding: 26px 250px 26px 210px;
  border-radius: 20px;
  color: #fff;
  background:
    linear-gradient(90deg, rgba(15, 61, 28, 0.95), rgba(29, 107, 54, 0.96)),
    var(--green-900);
  border: 1px solid rgba(255, 248, 232, 0.22);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.pickup-banner h2 {
  margin: 6px 0 4px;
  font-family: var(--font-display), Georgia, serif;
  font-size: 30px;
  line-height: 1;
}

.pickup-banner p {
  margin: 0;
  color: #d6e8d5;
  font-size: 14px;
}

.free-label {
  display: inline-block;
  padding: 4px 10px;
  border: 1px dashed #f2d27b;
  border-radius: 999px;
  color: #ffe79b;
  font-size: 11px;
  font-weight: 900;
}

.pickup-truck {
  position: absolute;
  left: 24px;
  top: 23px;
  width: 165px;
  height: 108px;
}

.pickup-paper {
  position: absolute;
  left: 0;
  top: 0;
  width: 110px;
  height: 86px;
  border-radius: 12px;
  background: repeating-linear-gradient(180deg, #fff8e8 0 12px, #ecdfbe 12px 14px);
  transform: rotate(-8deg);
}

.pickup-car {
  position: absolute;
  left: 38px;
  bottom: 8px;
  width: 110px;
  height: 62px;
  display: grid;
  place-items: center;
  color: #eaffea;
  font-weight: 900;
  background: #356f3c;
  border-radius: 12px;
  box-shadow: 0 12px 20px rgba(0,0,0,0.22);
}

.orange-btn {
  position: absolute;
  right: 205px;
  bottom: 32px;
  padding: 13px 17px;
  color: #fff;
  background: var(--terracotta);
}

.ticket-stamp {
  position: absolute;
  right: 32px;
  top: 20px;
  width: 132px;
  height: 108px;
  display: grid;
  place-items: center;
  text-align: center;
  color: var(--green-900);
  font-family: var(--font-display), Georgia, serif;
  font-weight: 900;
  background: var(--cream-2);
  border: 2px dashed #d0bc88;
  border-radius: 12px;
  transform: rotate(-6deg);
}

.stat-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.stat-card,
.classic-panel,
.market-item-card,
.market-support-note {
  border: 1px solid #e2d4b7;
  background: rgba(255, 252, 242, 0.94);
  border-radius: 18px;
  box-shadow: 0 12px 28px rgba(36, 45, 29, 0.07);
}

.stat-card {
  padding: 18px;
}

.stat-card small {
  display: block;
  color: var(--green-800);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 11px;
  font-weight: 900;
}

.stat-card strong {
  display: block;
  margin: 7px 0 2px;
  font-size: 29px;
  line-height: 1;
}

.stat-card span {
  color: var(--muted);
  font-size: 12px;
}

.dashboard-main-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 16px;
  margin-top: 16px;
}

.classic-panel {
  padding: 20px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 12px;
  margin-bottom: 16px;
}

.panel-head h2,
.side-impact h2,
.quick-actions h2 {
  margin: 0;
  font-size: 18px;
}

.panel-head p {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.green-small-btn {
  padding: 11px 15px;
  color: #fff;
  background: var(--green-800);
}

.empty-retro {
  min-height: 190px;
  display: grid;
  place-items: center;
  text-align: center;
  color: var(--muted);
}

.empty-icon {
  width: 62px;
  height: 62px;
  display: grid;
  place-items: center;
  margin: 0 auto 12px;
  border-radius: 18px;
  color: var(--green-800);
  background: #edf4df;
  font-weight: 900;
}

.empty-retro h3 {
  margin: 0 0 6px;
  color: var(--ink);
}

.empty-retro p {
  margin: 0;
  font-size: 13px;
}

.request-list {
  display: grid;
  gap: 12px;
}

.request-row {
  display: grid;
  grid-template-columns: 70px 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 14px;
  border: 1px dashed #dfd2b1;
  border-radius: 16px;
  background: #fff9ea;
}

.date-card {
  min-height: 64px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: #f0e2bd;
  color: var(--green-950);
}

.date-card strong {
  font-size: 22px;
}

.date-card span {
  font-size: 10px;
  font-weight: 800;
}

.request-row h3 {
  margin: 0 0 4px;
  font-size: 15px;
}

.request-row p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}

.status-pill {
  padding: 7px 11px;
  border-radius: 999px;
  background: #eef3e7;
  color: var(--green-800);
  font-size: 11px;
  font-weight: 900;
}

.status-pill.warning {
  background: #fff3cc;
  color: #9a6511;
}

.status-pill.info {
  background: #e8f1ff;
  color: #245da8;
}

.status-pill.process {
  background: #efe8ff;
  color: #6d3cc7;
}

.status-pill.success {
  background: #e5f8e9;
  color: var(--green-800);
}

.status-pill.danger {
  background: #fee2e2;
  color: #b91c1c;
}

.dashboard-side {
  display: grid;
  gap: 16px;
}

.earth-illustration {
  width: 110px;
  height: 110px;
  display: grid;
  place-items: center;
  margin: 14px auto;
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 30%, #8acb89 0 16%, transparent 17%),
    radial-gradient(circle at 60% 62%, #6a9f5a 0 18%, transparent 19%),
    #dceec8;
  color: var(--green-900);
  font-weight: 900;
  border: 3px solid #c9dab7;
}

.side-impact ul {
  padding: 0;
  margin: 0;
  list-style: none;
}

.side-impact li {
  display: flex;
  justify-content: space-between;
  padding: 9px 0;
  border-top: 1px dashed #dfd2b1;
  font-size: 13px;
}

.side-impact span {
  color: var(--muted);
}

.quick-actions {
  display: grid;
  gap: 10px;
}

.quick-actions button {
  padding: 12px;
  border: 1px solid #dfd2b1;
  border-radius: 13px;
  background: #fff9ea;
  color: var(--green-900);
  font-weight: 900;
}

.classic-footer-note {
  margin-top: 16px;
  padding: 16px;
  border-top: 1px solid #e2d4b7;
  border-bottom: 1px solid #e2d4b7;
  color: var(--green-800);
  text-align: center;
  font-family: var(--font-display), Georgia, serif;
  font-weight: 700;
}

/* PASARCUAN CLASSIC */

.market-page-classic {
  padding-bottom: 52px;
}

.market-classic-hero,
.market-toolbar,
.category-tabs,
.market-support-note,
.market-grid-classic {
  max-width: 1180px;
  margin-left: auto;
  margin-right: auto;
}

.market-classic-hero {
  margin-top: 26px;
  padding: 34px;
  min-height: 210px;
  display: grid;
  grid-template-columns: 1fr 340px;
  align-items: center;
  gap: 24px;
  border: 1px solid #e2d4b7;
  border-radius: 24px;
  background:
    radial-gradient(circle at 80% 30%, rgba(34,197,94,0.12), transparent 28%),
    linear-gradient(135deg, #fff8e8, #f5ebcf);
  box-shadow: var(--shadow);
}

.market-classic-hero h1 {
  margin: 14px 0 8px;
  color: var(--green-900);
  font-size: 48px;
}

.market-classic-hero p {
  max-width: 620px;
  color: var(--muted);
  line-height: 1.7;
}

.market-stall {
  position: relative;
  height: 150px;
}

.stall-roof {
  position: absolute;
  top: 0;
  left: 45px;
  right: 35px;
  height: 52px;
  border-radius: 16px 16px 6px 6px;
  background: repeating-linear-gradient(90deg, var(--green-800) 0 42px, #fff5d8 42px 84px);
  border: 2px solid var(--green-800);
}

.stall-table {
  position: absolute;
  left: 25px;
  right: 16px;
  bottom: 0;
  min-height: 96px;
  padding: 26px 18px 18px;
  display: flex;
  gap: 12px;
  align-items: end;
  justify-content: center;
  border-radius: 18px;
  background: #d7b978;
  border: 2px solid #9b7b3c;
}

.stall-table span {
  width: 60px;
  height: 60px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: #fff8e8;
  color: var(--green-800);
  font-size: 11px;
  font-weight: 900;
}

.market-toolbar {
  margin-top: 16px;
  padding: 16px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 14px;
  align-items: center;
}

.classic-search {
  display: flex;
  align-items: center;
  gap: 12px;
}

.classic-search span {
  color: var(--green-900);
  font-weight: 900;
}

.category-tabs {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.category-tabs button {
  padding: 10px 15px;
  border: 1px solid #e2d4b7;
  border-radius: 14px;
  background: #fffdf6;
  color: var(--ink);
  font-weight: 900;
}

.category-tabs button span {
  color: var(--green-700);
  margin-right: 8px;
}

.category-tabs button.active {
  color: #fff;
  background: var(--green-800);
}

.category-tabs button.active span {
  color: #fff2b4;
}

.market-support-note {
  margin-top: 16px;
  padding: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  background:
    radial-gradient(circle at 90% 45%, rgba(34,197,94,0.1), transparent 26%),
    #fff8e8;
}

.market-support-note h2 {
  margin: 0 0 5px;
  font-size: 22px;
  font-family: var(--font-display), Georgia, serif;
  color: var(--green-900);
}

.market-support-note p {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
}

.market-support-note button {
  flex: 0 0 auto;
  padding: 13px 16px;
  border: 0;
  border-radius: 13px;
  color: #fff;
  background: var(--terracotta);
  font-weight: 900;
}

.market-grid-classic {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.market-item-card {
  overflow: hidden;
}

.item-image {
  position: relative;
  height: 150px;
  display: grid;
  place-items: center;
  background: #efe3c4;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-image > span {
  font-size: 34px;
  color: var(--green-800);
  font-weight: 900;
}

.item-image small {
  position: absolute;
  left: 10px;
  top: 10px;
  padding: 6px 9px;
  border-radius: 999px;
  background: rgba(255, 248, 232, 0.92);
  color: var(--green-800);
  font-size: 10px;
  font-weight: 900;
}

.item-body {
  padding: 14px;
}

.item-body h2 {
  margin: 0 0 6px;
  min-height: 38px;
  font-size: 15px;
}

.item-body p {
  margin: 0 0 10px;
  color: var(--muted);
  font-size: 12px;
}

.item-body strong {
  color: var(--green-800);
  font-size: 19px;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  margin: 9px 0 12px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
}

.soft-btn {
  padding: 11px 15px;
  color: var(--green-900);
  background: #f0e2bd;
}

/* RESPONSIVE */

@media (max-width: 1000px) {
  .login-hero,
  .household-hero,
  .market-classic-hero,
  .dashboard-main-grid {
    grid-template-columns: 1fr;
  }

  .login-visual-panel {
    min-height: 620px;
  }

  .pickup-banner {
    padding: 180px 20px 24px;
  }

  .orange-btn {
    position: static;
    margin-top: 16px;
  }

  .ticket-stamp {
    right: 20px;
  }

  .market-grid-classic,
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .market-toolbar,
  .market-support-note {
    grid-template-columns: 1fr;
    display: grid;
  }
}

@media (max-width: 720px) {
  .login-nav,
  .app-navbar {
    height: auto;
    flex-wrap: wrap;
    gap: 16px;
    padding-top: 16px;
    padding-bottom: 16px;
  }

  .login-nav-links {
    display: none;
  }

  .app-nav-links {
    order: 3;
    width: 100%;
    overflow-x: auto;
  }

  .app-greeting {
    display: none;
  }

  .login-hero {
    padding: 22px 18px 36px;
  }

  .login-copy h1 {
    font-size: 44px;
  }

  .login-visual-panel {
    min-height: 650px;
    padding: 18px;
  }

  .login-card {
    left: 18px;
    right: 18px;
    width: auto;
  }

  .login-stats,
  .market-grid-classic,
  .stat-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-container,
  .household-hero,
  .market-classic-hero,
  .market-toolbar,
  .category-tabs,
  .market-support-note,
  .market-grid-classic {
    width: calc(100% - 24px);
    padding-left: 0;
    padding-right: 0;
  }

  .market-classic-hero,
  .market-toolbar,
  .market-support-note {
    padding: 20px;
  }

  .request-row {
    grid-template-columns: 1fr;
  }
}
'@

Write-Host ""
Write-Host "Selesai patch UI retro-classic CuanSampah." -ForegroundColor Green
Write-Host "File yang diubah:"
Write-Host "- components/BrandLogo.tsx"
Write-Host "- components/Navbar.tsx"
Write-Host "- app/layout.tsx"
Write-Host "- app/globals.css"
Write-Host "- app/(auth)/login/page.tsx"
Write-Host "- app/(dashboard)/household/page.tsx"
Write-Host "- app/bid/page.tsx"
Write-Host ""
Write-Host "Lanjut jalankan:"
Write-Host "npm run build"
Write-Host "npm run dev"
