"use client"
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
}