"use client"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Navbar from "@/components/Navbar"
import { getWhatsAppUrl } from "@/lib/phone"

type Listing = {
  title: string
  sellerName: string
  sellerPhone?: string | null
  description?: string | null
  photoUrl?: string | null
  contactName?: string | null
  contactPhone?: string | null
  bidCount?: number | string
  currentPrice: number | string
  minPrice: number | string
  maxPrice: number | string
  priceStep: number | string
  status: string
  expiresAt: string
}

type BidHistoryItem = {
  id: string
  bidderName: string
  createdAt: string
  amount: number | string
}

export default function BidDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [listing, setListing] = useState<Listing | null>(null)
  const [bidHistory, setBidHistory] = useState<BidHistoryItem[]>([])
  const [images, setImages] = useState<Array<{ id: string; imageUrl: string }>>([])
  const [loading, setLoading] = useState(true)
  const [bidding, setBidding] = useState(false)

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])
  useEffect(() => { if (status === "authenticated" && params.id) fetchDetail() }, [status, params.id])

  async function fetchDetail() {
    const res = await fetch("/api/bid/" + params.id).then(r => r.json())
    setListing({ ...res.listing, photoUrl: res.images?.[0]?.imageUrl || res.listing?.photoUrl })
    setBidHistory(res.bidHistory || [])
    setImages(res.images || [])
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

  function getTimeLeft(expiresAt: string) {
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) return "Berakhir"
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return h + " jam " + m + " menit lagi"
  }

  if (loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",color:"#9ca3af"}}>Memuat...</div>
  if (!listing) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",color:"#9ca3af"}}>Listing tidak ditemukan</div>

  const isOwner = session?.user?.name === listing.sellerName
  const nextPrice = Number(listing.currentPrice) + Number(listing.priceStep)
  const isFull = nextPrice > Number(listing.maxPrice)
  const progress = Math.round(((Number(listing.currentPrice) - Number(listing.minPrice)) / (Number(listing.maxPrice) - Number(listing.minPrice))) * 100)
  const sellerContactName = listing.contactName || listing.sellerName
  const sellerContactPhone = listing.contactPhone || listing.sellerPhone
  const sellerWhatsappUrl = getWhatsAppUrl(
    sellerContactPhone,
    `Halo, saya tertarik dengan listing PasarCuan: ${listing.title}. Apakah masih tersedia?`
  )

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
            {images.length > 1 && <div style={{display:"flex",gap:"8px",marginTop:"10px",overflowX:"auto"}}>{images.map((image) => <button key={image.id} type="button" onClick={() => setListing({ ...listing, photoUrl: image.imageUrl })} style={{border:listing.photoUrl===image.imageUrl?"2px solid #16a34a":"1px solid #e5e7eb",borderRadius:"6px",padding:0,background:"#fff"}}><img src={image.imageUrl} alt="thumbnail" style={{width:"72px",height:"56px",objectFit:"cover",borderRadius:"5px"}} /></button>)}</div>}
          </div>

          <div>
            <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"10px",padding:"20px",marginBottom:"14px"}}>
              <h1 style={{fontSize:"20px",fontWeight:"700",color:"#111",marginBottom:"4px",letterSpacing:"-0.3px"}}>{listing.title}</h1>
              <p style={{fontSize:"13px",color:"#9ca3af",marginBottom:"12px"}}>oleh {listing.sellerName}</p>
              <div style={{padding:"10px 12px",background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:"6px",marginBottom:"12px",fontSize:"12px",color:"#166534"}}>
                <strong>Kontak Penjual:</strong> {sellerContactName}{" "}
                {sellerWhatsappUrl ? (
                  <a
                    href={sellerWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{marginLeft:"8px",color:"#166534",fontWeight:"700"}}
                  >
                    Hubungi Penjual
                  </a>
                ) : (
                  <span
                    aria-disabled="true"
                    style={{marginLeft:"8px",color:"#6b7280",fontWeight:"700",cursor:"not-allowed"}}
                  >
                    Nomor penjual belum tersedia
                  </span>
                )}
              </div>
              {listing.description && <p style={{fontSize:"13px",color:"#374151",lineHeight:"1.6",marginBottom:"14px",paddingTop:"12px",borderTop:"1px solid #f3f4f6"}}>{listing.description}</p>}

              <div style={{padding:"12px",background:"#f9fafb",borderRadius:"6px",marginBottom:"14px",border:"1px solid #f3f4f6"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                  <span style={{fontSize:"11px",color:"#9ca3af"}}>Harga saat ini</span>
                  <span style={{fontSize:"11px",color:"#16a34a",fontWeight:"600"}}>{listing.bidCount} bid</span>
                </div>
                <div style={{fontSize:"26px",fontWeight:"700",color:"#111",marginBottom:"8px"}}>Rp {Number(listing.currentPrice).toLocaleString("id-ID")}</div>
                <div style={{height:"5px",background:"#e5e7eb",borderRadius:"3px",overflow:"hidden",marginBottom:"4px"}}>
                  <div style={{height:"100%",width: progress + "%",background:"#16a34a",borderRadius:"3px"}}></div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:"10px",color:"#9ca3af"}}>Min: Rp {Number(listing.minPrice).toLocaleString("id-ID")}</span>
                  <span style={{fontSize:"10px",color:"#9ca3af"}}>Max: Rp {Number(listing.maxPrice).toLocaleString("id-ID")}</span>
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
                  <div style={{fontSize:"14px",fontWeight:"700",color: i===0 ? "#16a34a" : "#374151"}}>Rp {Number(bid.amount).toLocaleString("id-ID")}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
