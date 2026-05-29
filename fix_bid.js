const fs = require('fs');

// API - Get all bid listings
const bidsRoute = `import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import pool from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  try {
    const [listings] = await pool.execute(
      \`SELECT bl.*, u.fullName as sellerName,
        (SELECT COUNT(*) FROM bids b WHERE b.listingId = bl.id) as bidCount,
        (SELECT MAX(b.amount) FROM bids b WHERE b.listingId = bl.id) as highestBid
       FROM bid_listings bl
       JOIN users u ON bl.sellerId = u.id
       WHERE bl.status = "ACTIVE" AND bl.expiresAt > NOW()
       ORDER BY bl.createdAt DESC\`
    )
    return NextResponse.json({ listings })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const [users] = await pool.execute("SELECT id FROM users WHERE email = ?", [session.user.email])
    const sellerId = users[0]?.id

    const formData = await req.formData()
    const title = formData.get("title")
    const description = formData.get("description")
    const minPrice = parseInt(formData.get("minPrice"))
    const maxPrice = parseInt(formData.get("maxPrice"))
    const priceStep = parseInt(formData.get("priceStep"))
    const photo = formData.get("photo")

    let photoUrl = null
    if (photo && photo.size > 0) {
      const bytes = await photo.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filename = uuidv4() + "-" + photo.name.replace(/[^a-zA-Z0-9.]/g, "")
      const uploadDir = "public/uploads"
      const fs2 = require("fs")
      if (!fs2.existsSync(uploadDir)) fs2.mkdirSync(uploadDir, { recursive: true })
      fs2.writeFileSync(uploadDir + "/" + filename, buffer)
      photoUrl = "/uploads/" + filename
    }

    const id = uuidv4()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await pool.execute(
      "INSERT INTO bid_listings (id, sellerId, title, description, photoUrl, minPrice, maxPrice, currentPrice, priceStep, status, expiresAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [id, sellerId, title, description, photoUrl, minPrice, maxPrice, minPrice, priceStep, "ACTIVE", expiresAt]
    )

    return NextResponse.json({ message: "Listing berhasil dibuat", id }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}`;

// API - Place a bid
const bidRoute = `import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import pool from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

export async function POST(req, { params }) {
  try {
    const { id } = await params
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const [users] = await pool.execute("SELECT id, fullName FROM users WHERE email = ?", [session.user.email])
    const bidderId = users[0]?.id
    const bidderName = users[0]?.fullName

    const [listings] = await pool.execute("SELECT * FROM bid_listings WHERE id = ?", [id])
    const listing = listings[0]
    if (!listing) return NextResponse.json({ error: "Listing tidak ditemukan" }, { status: 404 })
    if (listing.status !== "ACTIVE") return NextResponse.json({ error: "Listing sudah tidak aktif" }, { status: 400 })
    if (listing.sellerId === bidderId) return NextResponse.json({ error: "Tidak bisa bid barang sendiri" }, { status: 400 })

    const nextPrice = listing.currentPrice + listing.priceStep
    if (nextPrice > listing.maxPrice) return NextResponse.json({ error: "Harga sudah mencapai maksimum" }, { status: 400 })

    await pool.execute(
      "INSERT INTO bids (id, listingId, bidderId, amount, createdAt) VALUES (?, ?, ?, ?, NOW())",
      [uuidv4(), id, bidderId, nextPrice]
    )

    await pool.execute(
      "UPDATE bid_listings SET currentPrice = ?, updatedAt = NOW() WHERE id = ?",
      [nextPrice, id]
    )

    // Auto close if max price reached
    if (nextPrice >= listing.maxPrice) {
      await pool.execute(
        "UPDATE bid_listings SET status = ?, winnerId = ?, updatedAt = NOW() WHERE id = ?",
        ["SOLD", bidderId, id]
      )
    }

    // Add notification to seller
    await pool.execute(
      "INSERT INTO notifications (id, userId, title, message, type, referenceId, isRead, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
      [uuidv4(), listing.sellerId, "Ada Bid Baru!", bidderName + " menawar " + listing.title + " seharga Rp " + nextPrice.toLocaleString("id-ID"), "BID", id, false]
    )

    return NextResponse.json({ message: "Bid berhasil", newPrice: nextPrice })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function GET(req, { params }) {
  try {
    const { id } = await params
    const [listing] = await pool.execute(
      \`SELECT bl.*, u.fullName as sellerName,
        (SELECT COUNT(*) FROM bids b WHERE b.listingId = bl.id) as bidCount
       FROM bid_listings bl JOIN users u ON bl.sellerId = u.id WHERE bl.id = ?\`,
      [id]
    )
    const [bidHistory] = await pool.execute(
      "SELECT b.*, u.fullName as bidderName FROM bids b JOIN users u ON b.bidderId = u.id WHERE b.listingId = ? ORDER BY b.createdAt DESC",
      [id]
    )
    return NextResponse.json({ listing: listing[0], bidHistory })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}`;

// Bid marketplace page
const bidPage = `"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navbar from "@/components/Navbar"

export default function BidPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])
  useEffect(() => { if (status === "authenticated") fetchListings() }, [status])

  async function fetchListings() {
    setLoading(true)
    const res = await fetch("/api/bid").then(r => r.json())
    setListings(res.listings || [])
    setLoading(false)
  }

  async function placeBid(listingId) {
    const res = await fetch("/api/bid/" + listingId, { method: "POST" })
    const data = await res.json()
    if (res.ok) { alert("Bid berhasil! Harga sekarang: Rp " + data.newPrice.toLocaleString("id-ID")); fetchListings() }
    else alert(data.error)
  }

  function getTimeLeft(expiresAt) {
    const diff = new Date(expiresAt) - new Date()
    if (diff <= 0) return "Berakhir"
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return h + "j " + m + "m"
  }

  if (status === "loading") return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",color:"#9ca3af"}}>Memuat...</div>

  return (
    <div style={{minHeight:"100vh",background:"#f9fafb"}}>
      <Navbar userName={session?.user?.name || ""} role={session?.user?.role} />
      <div style={{maxWidth:"900px",margin:"0 auto",padding:"32px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"24px"}}>
          <div>
            <h1 style={{fontSize:"20px",fontWeight:"700",color:"#111",marginBottom:"2px",letterSpacing:"-0.3px"}}>PasarCuan</h1>
            <p style={{fontSize:"13px",color:"#9ca3af"}}>Bid barang bernilai dari sesama pengguna</p>
          </div>
          <button onClick={() => router.push("/bid/new")}
            style={{background:"#16a34a",color:"#fff",border:"none",padding:"9px 18px",borderRadius:"6px",fontSize:"13px",fontWeight:"600",cursor:"pointer"}}>
            + Jual Barang
          </button>
        </div>

        {loading ? (
          <div style={{textAlign:"center",padding:"60px",fontSize:"13px",color:"#9ca3af"}}>Memuat listing...</div>
        ) : listings.length === 0 ? (
          <div style={{textAlign:"center",padding:"60px",background:"#fff",borderRadius:"8px",border:"1px solid #e5e7eb"}}>
            <div style={{fontSize:"32px",marginBottom:"12px"}}>🏷</div>
            <p style={{fontSize:"14px",fontWeight:"600",color:"#374151",marginBottom:"4px"}}>Belum ada listing</p>
            <p style={{fontSize:"13px",color:"#9ca3af"}}>Jadilah yang pertama menjual barang bernilai</p>
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"16px"}}>
            {listings.map(item => {
              const nextPrice = item.currentPrice + item.priceStep
              const isOwner = session?.user?.email && item.sellerName === session?.user?.name
              const isFull = nextPrice > item.maxPrice
              const progress = Math.round(((item.currentPrice - item.minPrice) / (item.maxPrice - item.minPrice)) * 100)

              return (
                <div key={item.id} style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"10px",overflow:"hidden",cursor:"pointer"}} onClick={() => router.push("/bid/" + item.id)}>
                  {item.photoUrl ? (
                    <img src={item.photoUrl} alt={item.title} style={{width:"100%",height:"180px",objectFit:"cover"}} />
                  ) : (
                    <div style={{width:"100%",height:"180px",background:"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"40px"}}>📦</div>
                  )}
                  <div style={{padding:"14px 16px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
                      <h3 style={{fontSize:"14px",fontWeight:"700",color:"#111",flex:1,marginRight:"8px"}}>{item.title}</h3>
                      <span style={{fontSize:"10px",padding:"2px 8px",borderRadius:"4px",background:"#f0fdf4",color:"#166534",fontWeight:"600",flexShrink:0,border:"1px solid #bbf7d0"}}>{getTimeLeft(item.expiresAt)}</span>
                    </div>
                    <p style={{fontSize:"12px",color:"#9ca3af",marginBottom:"12px"}}>oleh {item.sellerName}</p>

                    <div style={{marginBottom:"10px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                        <span style={{fontSize:"11px",color:"#9ca3af"}}>Harga saat ini</span>
                        <span style={{fontSize:"11px",color:"#9ca3af"}}>{item.bidCount} bid</span>
                      </div>
                      <div style={{fontSize:"20px",fontWeight:"700",color:"#111",marginBottom:"6px"}}>Rp {parseInt(item.currentPrice).toLocaleString("id-ID")}</div>
                      <div style={{height:"4px",background:"#f3f4f6",borderRadius:"2px",overflow:"hidden"}}>
                        <div style={{height:"100%",width: progress + "%",background:"#16a34a",borderRadius:"2px"}}></div>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",marginTop:"3px"}}>
                        <span style={{fontSize:"10px",color:"#9ca3af"}}>Min: Rp {parseInt(item.minPrice).toLocaleString("id-ID")}</span>
                        <span style={{fontSize:"10px",color:"#9ca3af"}}>Max: Rp {parseInt(item.maxPrice).toLocaleString("id-ID")}</span>
                      </div>
                    </div>

                    {!isOwner && !isFull && (
                      <button onClick={e => { e.stopPropagation(); placeBid(item.id) }}
                        style={{width:"100%",padding:"9px",borderRadius:"6px",border:"none",background:"#111",color:"#fff",fontSize:"13px",fontWeight:"600",cursor:"pointer"}}>
                        Bid Rp {nextPrice.toLocaleString("id-ID")}
                      </button>
                    )}
                    {isFull && <div style={{textAlign:"center",padding:"9px",fontSize:"12px",color:"#16a34a",fontWeight:"600",border:"1px solid #bbf7d0",borderRadius:"6px",background:"#f0fdf4"}}>Terjual</div>}
                    {isOwner && <div style={{textAlign:"center",padding:"9px",fontSize:"12px",color:"#9ca3af",border:"1px solid #f3f4f6",borderRadius:"6px"}}>Listing kamu</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}`;

// New bid listing page
const newBidPage = `"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Navbar from "@/components/Navbar"

export default function NewBidPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [form, setForm] = useState({ title: "", description: "", minPrice: "", maxPrice: "", priceStep: "" })
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!photo) { setError("Foto barang wajib diupload"); return }
    if (parseInt(form.maxPrice) <= parseInt(form.minPrice)) { setError("Harga maksimum harus lebih besar dari minimum"); return }
    setLoading(true)
    setError("")

    const formData = new FormData()
    formData.append("title", form.title)
    formData.append("description", form.description)
    formData.append("minPrice", form.minPrice)
    formData.append("maxPrice", form.maxPrice)
    formData.append("priceStep", form.priceStep)
    formData.append("photo", photo)

    const res = await fetch("/api/bid", { method: "POST", body: formData })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    router.push("/bid")
  }

  const S = { input: {width:"100%",padding:"10px 14px",borderRadius:"6px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none",boxSizing:"border-box",color:"#111"} }

  return (
    <div style={{minHeight:"100vh",background:"#f9fafb"}}>
      <Navbar userName={session?.user?.name || ""} role={session?.user?.role} />
      <div style={{maxWidth:"600px",margin:"0 auto",padding:"32px 24px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"24px"}}>
          <button onClick={() => router.back()} style={{background:"none",border:"none",fontSize:"13px",color:"#9ca3af",cursor:"pointer",padding:0}}>Kembali</button>
          <div style={{width:"1px",height:"14px",background:"#e5e7eb"}}></div>
          <h1 style={{fontSize:"18px",fontWeight:"700",color:"#111",letterSpacing:"-0.3px"}}>Jual Barang via Bid</h1>
        </div>

        {error && <div style={{fontSize:"13px",padding:"10px 14px",borderRadius:"6px",background:"#fef2f2",color:"#dc2626",marginBottom:"16px",border:"1px solid #fecaca"}}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"20px",marginBottom:"14px"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:"#374151",letterSpacing:"1px",marginBottom:"16px"}}>FOTO BARANG</div>
            <label style={{display:"block",cursor:"pointer"}}>
              {preview ? (
                <img src={preview} alt="preview" style={{width:"100%",height:"220px",objectFit:"cover",borderRadius:"6px",border:"1px solid #e5e7eb"}} />
              ) : (
                <div style={{width:"100%",height:"220px",border:"2px dashed #e5e7eb",borderRadius:"6px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#f9fafb"}}>
                  <div style={{fontSize:"32px",marginBottom:"8px"}}>📷</div>
                  <p style={{fontSize:"13px",fontWeight:"600",color:"#374151",marginBottom:"2px"}}>Klik untuk upload foto</p>
                  <p style={{fontSize:"11px",color:"#9ca3af"}}>JPG, PNG, WEBP - Max 5MB</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}} />
            </label>
            {preview && (
              <button type="button" onClick={() => { setPhoto(null); setPreview(null) }}
                style={{marginTop:"8px",fontSize:"12px",color:"#ef4444",background:"none",border:"none",cursor:"pointer",padding:0}}>
                Hapus foto
              </button>
            )}
          </div>

          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"20px",marginBottom:"14px"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:"#374151",letterSpacing:"1px",marginBottom:"16px"}}>DETAIL BARANG</div>
            <div style={{marginBottom:"12px"}}>
              <label style={{display:"block",fontSize:"11px",fontWeight:"700",color:"#374151",marginBottom:"5px",letterSpacing:"0.3px"}}>NAMA BARANG</label>
              <input type="text" value={form.title} onChange={e => setForm({...form,title:e.target.value})} style={S.input} placeholder="Contoh: Raket Tennis Wilson Pro" required />
            </div>
            <div>
              <label style={{display:"block",fontSize:"11px",fontWeight:"700",color:"#374151",marginBottom:"5px",letterSpacing:"0.3px"}}>DESKRIPSI</label>
              <textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})}
                style={{...S.input,resize:"vertical"}} placeholder="Kondisi barang, alasan jual, dll" rows={3} />
            </div>
          </div>

          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"20px",marginBottom:"14px"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:"#374151",letterSpacing:"1px",marginBottom:"16px"}}>PENGATURAN BID</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
              <div>
                <label style={{display:"block",fontSize:"11px",fontWeight:"700",color:"#374151",marginBottom:"5px",letterSpacing:"0.3px"}}>HARGA MINIMUM (Rp)</label>
                <input type="number" min="1000" value={form.minPrice} onChange={e => setForm({...form,minPrice:e.target.value})} style={S.input} placeholder="50000" required />
              </div>
              <div>
                <label style={{display:"block",fontSize:"11px",fontWeight:"700",color:"#374151",marginBottom:"5px",letterSpacing:"0.3px"}}>HARGA MAKSIMUM (Rp)</label>
                <input type="number" min="1000" value={form.maxPrice} onChange={e => setForm({...form,maxPrice:e.target.value})} style={S.input} placeholder="500000" required />
              </div>
            </div>
            <div>
              <label style={{display:"block",fontSize:"11px",fontWeight:"700",color:"#374151",marginBottom:"5px",letterSpacing:"0.3px"}}>KELIPATAN BID (Rp)</label>
              <input type="number" min="1000" value={form.priceStep} onChange={e => setForm({...form,priceStep:e.target.value})} style={S.input} placeholder="10000" required />
            </div>
            {form.minPrice && form.maxPrice && form.priceStep && (
              <div style={{marginTop:"12px",padding:"12px",background:"#f9fafb",borderRadius:"6px",fontSize:"12px",color:"#374151",border:"1px solid #f3f4f6"}}>
                Bid dimulai dari <strong>Rp {parseInt(form.minPrice).toLocaleString("id-ID")}</strong>, naik <strong>Rp {parseInt(form.priceStep).toLocaleString("id-ID")}</strong> tiap bid, max <strong>Rp {parseInt(form.maxPrice).toLocaleString("id-ID")}</strong>. Berlaku selama <strong>24 jam</strong>.
              </div>
            )}
          </div>

          <button type="submit" disabled={loading}
            style={{width:"100%",padding:"12px",borderRadius:"6px",border:"none",background:loading?"#9ca3af":"#111",color:"#fff",fontSize:"13px",fontWeight:"600",cursor:loading?"not-allowed":"pointer"}}>
            {loading ? "Membuat listing..." : "Publish Listing Bid"}
          </button>
        </form>
      </div>
    </div>
  )
}`;

// Bid detail page
const bidDetailPage = `"use client"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Navbar from "@/components/Navbar"

export default function BidDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [listing, setListing] = useState(null)
  const [bidHistory, setBidHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [bidding, setBidding] = useState(false)

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])
  useEffect(() => { if (status === "authenticated" && params.id) fetchDetail() }, [status, params.id])

  async function fetchDetail() {
    const res = await fetch("/api/bid/" + params.id).then(r => r.json())
    setListing(res.listing)
    setBidHistory(res.bidHistory || [])
    setLoading(false)
  }

  async function placeBid() {
    setBidding(true)
    const res = await fetch("/api/bid/" + params.id, { method: "POST" })
    const data = await res.json()
    if (res.ok) { alert("Bid berhasil! Harga: Rp " + data.newPrice.toLocaleString("id-ID")); fetchDetail() }
    else alert(data.error)
    setBidding(false)
  }

  function getTimeLeft(expiresAt) {
    const diff = new Date(expiresAt) - new Date()
    if (diff <= 0) return "Berakhir"
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return h + " jam " + m + " menit lagi"
  }

  if (loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",color:"#9ca3af"}}>Memuat...</div>
  if (!listing) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",color:"#9ca3af"}}>Listing tidak ditemukan</div>

  const isOwner = session?.user?.name === listing.sellerName
  const nextPrice = listing.currentPrice + listing.priceStep
  const isFull = nextPrice > listing.maxPrice
  const progress = Math.round(((listing.currentPrice - listing.minPrice) / (listing.maxPrice - listing.minPrice)) * 100)

  return (
    <div style={{minHeight:"100vh",background:"#f9fafb"}}>
      <Navbar userName={session?.user?.name || ""} role={session?.user?.role} />
      <div style={{maxWidth:"860px",margin:"0 auto",padding:"32px 24px"}}>
        <button onClick={() => router.push("/bid")} style={{background:"none",border:"none",fontSize:"13px",color:"#9ca3af",cursor:"pointer",marginBottom:"20px",padding:0}}>Kembali ke PasarCuan</button>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"24px"}}>
          <div>
            {listing.photoUrl ? (
              <img src={listing.photoUrl} alt={listing.title} style={{width:"100%",borderRadius:"10px",border:"1px solid #e5e7eb"}} />
            ) : (
              <div style={{width:"100%",aspectRatio:"1",background:"#f3f4f6",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"60px"}}>📦</div>
            )}
          </div>

          <div>
            <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"10px",padding:"20px",marginBottom:"14px"}}>
              <h1 style={{fontSize:"20px",fontWeight:"700",color:"#111",marginBottom:"4px",letterSpacing:"-0.3px"}}>{listing.title}</h1>
              <p style={{fontSize:"13px",color:"#9ca3af",marginBottom:"12px"}}>oleh {listing.sellerName}</p>
              {listing.description && <p style={{fontSize:"13px",color:"#374151",lineHeight:"1.6",marginBottom:"14px",paddingTop:"12px",borderTop:"1px solid #f3f4f6"}}>{listing.description}</p>}

              <div style={{padding:"12px",background:"#f9fafb",borderRadius:"6px",marginBottom:"14px",border:"1px solid #f3f4f6"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                  <span style={{fontSize:"11px",color:"#9ca3af"}}>Harga saat ini</span>
                  <span style={{fontSize:"11px",color:"#16a34a",fontWeight:"600"}}>{listing.bidCount} bid</span>
                </div>
                <div style={{fontSize:"26px",fontWeight:"700",color:"#111",marginBottom:"8px"}}>Rp {parseInt(listing.currentPrice).toLocaleString("id-ID")}</div>
                <div style={{height:"5px",background:"#e5e7eb",borderRadius:"3px",overflow:"hidden",marginBottom:"4px"}}>
                  <div style={{height:"100%",width: progress + "%",background:"#16a34a",borderRadius:"3px"}}></div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:"10px",color:"#9ca3af"}}>Min: Rp {parseInt(listing.minPrice).toLocaleString("id-ID")}</span>
                  <span style={{fontSize:"10px",color:"#9ca3af"}}>Max: Rp {parseInt(listing.maxPrice).toLocaleString("id-ID")}</span>
                </div>
              </div>

              <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"14px"}}>
                <div style={{width:"6px",height:"6px",borderRadius:"50%",background: listing.status === "ACTIVE" ? "#16a34a" : "#9ca3af"}}></div>
                <span style={{fontSize:"11px",color:"#374151",fontWeight:"500"}}>{listing.status === "ACTIVE" ? getTimeLeft(listing.expiresAt) : "Sudah berakhir"}</span>
              </div>

              {!isOwner && listing.status === "ACTIVE" && !isFull && (
                <button onClick={placeBid} disabled={bidding}
                  style={{width:"100%",padding:"12px",borderRadius:"6px",border:"none",background:bidding?"#9ca3af":"#111",color:"#fff",fontSize:"14px",fontWeight:"700",cursor:bidding?"not-allowed":"pointer"}}>
                  {bidding ? "Memproses..." : "Bid Rp " + nextPrice.toLocaleString("id-ID")}
                </button>
              )}
              {isFull && <div style={{textAlign:"center",padding:"12px",fontSize:"13px",color:"#16a34a",fontWeight:"700",border:"1px solid #bbf7d0",borderRadius:"6px",background:"#f0fdf4"}}>Barang Terjual</div>}
              {isOwner && <div style={{textAlign:"center",padding:"12px",fontSize:"12px",color:"#9ca3af",border:"1px solid #f3f4f6",borderRadius:"6px"}}>Ini adalah listing kamu</div>}
            </div>
          </div>
        </div>

        <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"10px",padding:"20px",marginTop:"16px"}}>
          <div style={{fontSize:"10px",fontWeight:"700",color:"#374151",letterSpacing:"1px",marginBottom:"14px"}}>RIWAYAT BID ({bidHistory.length})</div>
          {bidHistory.length === 0 ? (
            <p style={{fontSize:"13px",color:"#9ca3af",textAlign:"center",padding:"20px 0"}}>Belum ada bid. Jadilah yang pertama!</p>
          ) : (
            <div>
              {bidHistory.map((bid, i) => (
                <div key={bid.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom: i < bidHistory.length-1 ? "1px solid #f9fafb" : "none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                    <div style={{width:"28px",height:"28px",borderRadius:"50%",background:"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:"700",color:"#374151"}}>
                      {bid.bidderName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{fontSize:"12px",fontWeight:"600",color:"#111"}}>{bid.bidderName}</p>
                      <p style={{fontSize:"11px",color:"#9ca3af"}}>{new Date(bid.createdAt).toLocaleString("id-ID")}</p>
                    </div>
                  </div>
                  <div style={{fontSize:"14px",fontWeight:"700",color: i===0 ? "#16a34a" : "#374151"}}>Rp {parseInt(bid.amount).toLocaleString("id-ID")}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}`;

// Create directories and files
const dirs = [
  'app/api/bid',
  'app/api/bid/[id]',
  'app/bid',
  'app/bid/new',
  'app/bid/[id]',
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

fs.writeFileSync('app/api/bid/route.ts', bidsRoute, {encoding:'utf8'});
fs.writeFileSync('app/api/bid/[id]/route.ts', bidRoute, {encoding:'utf8'});
fs.writeFileSync('app/bid/page.tsx', bidPage, {encoding:'utf8'});
fs.writeFileSync('app/bid/new/page.tsx', newBidPage, {encoding:'utf8'});
fs.writeFileSync('app/bid/[id]/page.tsx', bidDetailPage, {encoding:'utf8'});

console.log('All bid files OK!');
