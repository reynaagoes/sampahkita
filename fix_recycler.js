const fs = require('fs');

const recycler = `"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navbar from "@/components/Navbar"

export default function RecyclerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [batches, setBatches] = useState([])
  const [myPurchases, setMyPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("available")

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])
  useEffect(() => { if (status === "authenticated") fetchData() }, [status])

  async function fetchData() {
    setLoading(true)
    const [a, m] = await Promise.all([
      fetch("/api/batches/available").then(r => r.json()),
      fetch("/api/batches/my-purchases").then(r => r.json()),
    ])
    setBatches(a.batches || [])
    setMyPurchases(m.batches || [])
    setLoading(false)
  }

  async function purchase(batchId) {
    const res = await fetch("/api/batches/" + batchId + "/purchase", { method: "POST" })
    if (res.ok) { alert("Pembelian berhasil!"); fetchData() }
    else { const d = await res.json(); alert(d.error) }
  }

  if (status === "loading") return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",color:"#9ca3af"}}>Memuat...</div>

  const tabs = [
    { key: "available", label: "Batch Tersedia", count: batches.length },
    { key: "mypurchases", label: "Pembelian Saya", count: myPurchases.length },
  ]

  const totalBought = myPurchases.reduce((sum, b) => sum + (parseFloat(b.totalWeight) || 0), 0)

  return (
    <div style={{minHeight:"100vh",background:"#f9fafb"}}>
      <Navbar userName={session?.user?.name || ""} role="RECYCLER" />
      <div style={{maxWidth:"860px",margin:"0 auto",padding:"32px 24px"}}>
        <div style={{marginBottom:"24px"}}>
          <h1 style={{fontSize:"20px",fontWeight:"700",color:"#111",marginBottom:"2px",letterSpacing:"-0.3px"}}>Dashboard Recycler</h1>
          <p style={{fontSize:"13px",color:"#9ca3af"}}>Beli batch material daur ulang dari pengepul</p>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1px",background:"#e5e7eb",borderRadius:"8px",overflow:"hidden",marginBottom:"24px"}}>
          {[
            { label: "Batch Tersedia", value: batches.length, accent: true },
            { label: "Sudah Dibeli", value: myPurchases.length, accent: false },
            { label: "Total Berat Dibeli", value: totalBought.toFixed(1) + " kg", accent: false },
          ].map((s,i) => (
            <div key={s.label} style={{background:"#fff",padding:"20px 18px",borderBottom: s.accent ? "2px solid #16a34a" : "2px solid transparent"}}>
              <div style={{fontSize:"24px",fontWeight:"700",color:"#111",lineHeight:"1",marginBottom:"4px"}}>{s.value}</div>
              <div style={{fontSize:"11px",color:"#9ca3af"}}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"8px",overflow:"hidden",marginBottom:"16px"}}>
          <div style={{borderBottom:"1px solid #f3f4f6",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex"}}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{padding:"13px 20px",fontSize:"12px",fontWeight:"600",border:"none",background:"transparent",cursor:"pointer",borderBottom: tab===t.key ? "2px solid #111" : "2px solid transparent",color: tab===t.key ? "#111" : "#9ca3af"}}>
                  {t.label}
                  <span style={{marginLeft:"6px",fontSize:"10px",padding:"1px 6px",borderRadius:"10px",background: tab===t.key ? "#111" : "#f3f4f6",color: tab===t.key ? "#fff" : "#9ca3af"}}>{t.count}</span>
                </button>
              ))}
            </div>
            <button onClick={() => router.push("/bid")}
              style={{margin:"0 16px",padding:"7px 14px",borderRadius:"5px",border:"1px solid #e5e7eb",background:"#fff",color:"#111",fontSize:"11px",fontWeight:"600",cursor:"pointer"}}>
              Ke PasarCuan
            </button>
          </div>

          <div>
            {loading ? (
              <div style={{padding:"40px",textAlign:"center",fontSize:"13px",color:"#9ca3af"}}>Memuat data...</div>
            ) : tab === "available" ? (
              batches.length === 0 ? (
                <div style={{padding:"48px",textAlign:"center"}}>
                  <p style={{fontSize:"13px",color:"#9ca3af"}}>Belum ada batch tersedia</p>
                </div>
              ) : (
                <div>
                  {batches.map((batch, i) => (
                    <div key={batch.id} style={{padding:"16px 20px",borderBottom: i < batches.length-1 ? "1px solid #f9fafb" : "none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px"}}>
                          <span style={{fontSize:"12px",fontWeight:"700",color:"#111",textTransform:"capitalize"}}>{batch.wasteType}</span>
                          <span style={{fontSize:"10px",color:"#9ca3af"}}>dari {batch.collectorName}</span>
                        </div>
                        <div style={{display:"flex",gap:"16px",marginBottom:"4px"}}>
                          <span style={{fontSize:"13px",color:"#374151"}}>{batch.totalWeight} kg</span>
                          <span style={{fontSize:"13px",fontWeight:"700",color:"#111"}}>Rp {parseInt(batch.pricePerKg).toLocaleString("id-ID")}/kg</span>
                          <span style={{fontSize:"13px",color:"#16a34a",fontWeight:"600"}}>= Rp {(batch.totalWeight * batch.pricePerKg).toLocaleString("id-ID")}</span>
                        </div>
                        {batch.location && <div style={{fontSize:"11px",color:"#9ca3af"}}>{batch.location}</div>}
                      </div>
                      <button onClick={() => purchase(batch.id)}
                        style={{padding:"8px 18px",borderRadius:"5px",border:"none",background:"#16a34a",color:"#fff",fontSize:"12px",fontWeight:"600",cursor:"pointer",whiteSpace:"nowrap",marginLeft:"16px"}}>
                        Beli Batch
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : (
              myPurchases.length === 0 ? (
                <div style={{padding:"48px",textAlign:"center"}}>
                  <p style={{fontSize:"13px",color:"#9ca3af"}}>Belum ada pembelian</p>
                </div>
              ) : (
                <div>
                  {myPurchases.map((batch, i) => (
                    <div key={batch.id} style={{padding:"16px 20px",borderBottom: i < myPurchases.length-1 ? "1px solid #f9fafb" : "none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px"}}>
                          <span style={{fontSize:"12px",fontWeight:"700",color:"#111",textTransform:"capitalize"}}>{batch.wasteType}</span>
                          <div style={{display:"flex",alignItems:"center",gap:"4px"}}>
                            <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#16a34a"}}></div>
                            <span style={{fontSize:"10px",color:"#16a34a",fontWeight:"600"}}>Terbeli</span>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:"16px"}}>
                          <span style={{fontSize:"13px",color:"#374151"}}>{batch.totalWeight} kg</span>
                          <span style={{fontSize:"13px",fontWeight:"700",color:"#111"}}>Rp {(batch.totalWeight * batch.pricePerKg).toLocaleString("id-ID")}</span>
                        </div>
                        <div style={{fontSize:"11px",color:"#9ca3af",marginTop:"2px"}}>dari {batch.collectorName}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}`;

fs.writeFileSync('app/(dashboard)/recycler/page.tsx', recycler, {encoding:'utf8'});
console.log('recycler OK');
