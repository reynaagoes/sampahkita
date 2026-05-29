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

  const totalBought = myPurchases.reduce((sum, b) => sum + (parseFloat(b.totalWeight) || 0), 0)
  const tabs = [
    { key: "available", label: "Batch Tersedia", count: batches.length },
    { key: "mypurchases", label: "Pembelian Saya", count: myPurchases.length },
  ]

  const TYPE_COLOR = { plastik:"#16a34a", kertas:"#854d0e", logam:"#374151", kaca:"#155e75", elektronik:"#5b21b6" }

  return (
    <div style={{minHeight:"100vh",background:"#f9fafb"}}>
      <div style={{background:"#0f2d13",padding:"28px 24px 60px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,opacity:0.04}}>
          {["♻","🌿","📦","♻","🌱","📦","♻","🌿"].map((e,i) => (
            <span key={i} style={{position:"absolute",fontSize: i%2===0?"80px":"50px",top: (i*13)%80+"%",left: (i*15)%90+"%",transform:"rotate("+(i*23)+"deg)"}}>{e}</span>
          ))}
        </div>
        <Navbar userName={session?.user?.name || ""} role="RECYCLER" />
        <div style={{maxWidth:"860px",margin:"24px auto 0",position:"relative",zIndex:1}}>
          <div style={{display:"inline-block",border:"1px solid rgba(134,239,172,0.3)",color:"#86efac",fontSize:"10px",padding:"3px 10px",borderRadius:"20px",fontWeight:"600",marginBottom:"12px",letterSpacing:"1px"}}>DASHBOARD RECYCLER</div>
          <h1 style={{color:"#fff",fontSize:"28px",fontWeight:"700",marginBottom:"4px",letterSpacing:"-0.5px"}}>Selamat datang, {session?.user?.name?.split(" ")[0]}</h1>
          <p style={{color:"#6b7280",fontSize:"13px"}}>Beli batch material daur ulang berkualitas dari pengepul terverifikasi</p>
        </div>
      </div>

      <div style={{maxWidth:"860px",margin:"-32px auto 0",padding:"0 24px 32px",position:"relative",zIndex:2}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px",marginBottom:"20px"}}>
          {[
            { label: "BATCH TERSEDIA", value: batches.length, sub: "siap dibeli", accent: true },
            { label: "SUDAH DIBELI", value: myPurchases.length, sub: "total transaksi", accent: false },
            { label: "TOTAL BERAT", value: totalBought.toFixed(1) + " kg", sub: "material dibeli", accent: false },
          ].map(s => (
            <div key={s.label} style={{background:"#fff",borderRadius:"10px",padding:"16px 18px",border:"1px solid #e5e7eb",borderLeft: s.accent ? "3px solid #16a34a" : "1px solid #e5e7eb",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
              <div style={{fontSize:"10px",fontWeight:"700",color:"#9ca3af",letterSpacing:"0.8px",marginBottom:"8px"}}>{s.label}</div>
              <div style={{fontSize:"26px",fontWeight:"700",color:"#111",lineHeight:"1",marginBottom:"3px"}}>{s.value}</div>
              <div style={{fontSize:"11px",color:"#9ca3af"}}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{background:"#0f2d13",borderRadius:"10px",padding:"16px 20px",marginBottom:"20px",display:"flex",justifyContent:"space-between",alignItems:"center",border:"1px solid rgba(134,239,172,0.1)"}}>
          <div>
            <div style={{fontSize:"10px",fontWeight:"700",color:"#86efac",letterSpacing:"1px",marginBottom:"4px"}}>PASAR CUAN</div>
            <div style={{fontSize:"14px",fontWeight:"700",color:"#fff",marginBottom:"2px"}}>Ada barang bernilai dari pengguna lain</div>
            <div style={{fontSize:"11px",color:"#6b7280"}}>Raket, elektronik, dan barang lainnya tersedia untuk di-bid</div>
          </div>
          <button onClick={() => router.push("/bid")}
            style={{background:"#16a34a",color:"#fff",border:"none",padding:"9px 18px",borderRadius:"6px",fontSize:"12px",fontWeight:"600",cursor:"pointer",whiteSpace:"nowrap",marginLeft:"20px"}}>
            Ke PasarCuan
          </button>
        </div>

        <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"10px",overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
          <div style={{borderBottom:"1px solid #f3f4f6",display:"flex",alignItems:"center"}}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{padding:"13px 20px",fontSize:"12px",fontWeight:"600",border:"none",background:"transparent",cursor:"pointer",borderBottom: tab===t.key ? "2px solid #111" : "2px solid transparent",color: tab===t.key ? "#111" : "#9ca3af",display:"flex",alignItems:"center",gap:"6px"}}>
                {t.label}
                <span style={{fontSize:"10px",padding:"1px 6px",borderRadius:"8px",background: tab===t.key ? "#111" : "#f3f4f6",color: tab===t.key ? "#fff" : "#9ca3af"}}>{t.count}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{padding:"40px",textAlign:"center",fontSize:"13px",color:"#9ca3af"}}>Memuat data...</div>
          ) : tab === "available" ? (
            batches.length === 0 ? (
              <div style={{padding:"52px 20px",textAlign:"center"}}>
                <div style={{width:"44px",height:"44px",background:"#f0fdf4",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:"20px"}}>📦</div>
                <p style={{fontSize:"13px",fontWeight:"700",color:"#374151",marginBottom:"4px"}}>Belum ada batch tersedia</p>
                <p style={{fontSize:"12px",color:"#9ca3af"}}>Batch dari pengepul terverifikasi akan muncul di sini</p>
              </div>
            ) : (
              <div>
                {batches.map((batch, i) => (
                  <div key={batch.id} style={{padding:"16px 20px",borderBottom: i < batches.length-1 ? "1px solid #f9fafb" : "none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"5px"}}>
                        <div style={{width:"8px",height:"8px",borderRadius:"50%",background: TYPE_COLOR[batch.wasteType] || "#374151"}}></div>
                        <span style={{fontSize:"13px",fontWeight:"700",color:"#111",textTransform:"capitalize"}}>{batch.wasteType}</span>
                        <span style={{fontSize:"10px",color:"#9ca3af"}}>dari {batch.collectorName}</span>
                      </div>
                      <div style={{display:"flex",gap:"14px",marginBottom:"3px"}}>
                        <span style={{fontSize:"12px",color:"#374151"}}>{batch.totalWeight} kg</span>
                        <span style={{fontSize:"12px",fontWeight:"600",color:"#111"}}>Rp {parseInt(batch.pricePerKg).toLocaleString("id-ID")}/kg</span>
                        <span style={{fontSize:"12px",fontWeight:"700",color:"#16a34a"}}>= Rp {(batch.totalWeight * batch.pricePerKg).toLocaleString("id-ID")}</span>
                      </div>
                      {batch.location && <div style={{fontSize:"11px",color:"#9ca3af"}}>{batch.location}</div>}
                    </div>
                    <button onClick={() => purchase(batch.id)}
                      style={{padding:"8px 18px",borderRadius:"6px",border:"none",background:"#16a34a",color:"#fff",fontSize:"12px",fontWeight:"600",cursor:"pointer",whiteSpace:"nowrap",marginLeft:"16px"}}>
                      Beli Batch
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            myPurchases.length === 0 ? (
              <div style={{padding:"52px 20px",textAlign:"center"}}>
                <div style={{width:"44px",height:"44px",background:"#f9fafb",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:"20px"}}>🛒</div>
                <p style={{fontSize:"13px",fontWeight:"700",color:"#374151",marginBottom:"4px"}}>Belum ada pembelian</p>
                <p style={{fontSize:"12px",color:"#9ca3af"}}>Batch yang kamu beli akan muncul di sini</p>
              </div>
            ) : (
              <div>
                {myPurchases.map((batch, i) => (
                  <div key={batch.id} style={{padding:"16px 20px",borderBottom: i < myPurchases.length-1 ? "1px solid #f9fafb" : "none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"5px"}}>
                        <div style={{width:"8px",height:"8px",borderRadius:"50%",background: TYPE_COLOR[batch.wasteType] || "#374151"}}></div>
                        <span style={{fontSize:"13px",fontWeight:"700",color:"#111",textTransform:"capitalize"}}>{batch.wasteType}</span>
                        <div style={{display:"flex",alignItems:"center",gap:"3px"}}>
                          <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#16a34a"}}></div>
                          <span style={{fontSize:"10px",color:"#16a34a",fontWeight:"600"}}>Terbeli</span>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:"14px"}}>
                        <span style={{fontSize:"12px",color:"#374151"}}>{batch.totalWeight} kg</span>
                        <span style={{fontSize:"12px",fontWeight:"700",color:"#111"}}>Rp {(batch.totalWeight * batch.pricePerKg).toLocaleString("id-ID")}</span>
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
  )
}`;

fs.writeFileSync('app/(dashboard)/recycler/page.tsx', recycler, {encoding:'utf8'});
console.log('recycler OK');
