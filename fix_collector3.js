const fs = require('fs');

const collector = `"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navbar from "@/components/Navbar"

function PickupCard({ req, onComplete }) {
  const [weight, setWeight] = useState("")
  const types = JSON.parse(req.sampahTypes || "[]")
  return (
    <div style={{padding:"14px 20px",borderBottom:"1px solid #f9fafb"}}>
      <div style={{fontSize:"11px",color:"#9ca3af",marginBottom:"4px",textTransform:"capitalize"}}>{types.join(" / ")}</div>
      <div style={{fontSize:"13px",fontWeight:"600",color:"#111",marginBottom:"2px"}}>{req.addressDetail}</div>
      <div style={{fontSize:"11px",color:"#9ca3af",marginBottom:"10px"}}>Dari: {req.householdName}</div>
      {req.status !== "COMPLETED" ? (
        <div style={{display:"flex",gap:"8px"}}>
          <input type="number" placeholder="Berat aktual (kg)" value={weight} onChange={e => setWeight(e.target.value)}
            style={{flex:1,padding:"8px 12px",borderRadius:"5px",border:"1px solid #e5e7eb",fontSize:"12px",outline:"none"}} />
          <button onClick={() => onComplete(req.id, weight)} disabled={!weight}
            style={{padding:"8px 14px",borderRadius:"5px",border:"none",background:weight?"#16a34a":"#e5e7eb",color:weight?"#fff":"#9ca3af",fontSize:"12px",fontWeight:"600",cursor:weight?"pointer":"not-allowed"}}>
            Selesaikan
          </button>
        </div>
      ) : (
        <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
          <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#16a34a"}}></div>
          <span style={{fontSize:"11px",color:"#374151",fontWeight:"500"}}>Selesai - {req.actualWeight} kg</span>
        </div>
      )}
    </div>
  )
}

export default function CollectorDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState([])
  const [myPickups, setMyPickups] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("available")

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])
  useEffect(() => { if (status === "authenticated") fetchData() }, [status])

  async function fetchData() {
    setLoading(true)
    const [a, m] = await Promise.all([
      fetch("/api/requests/available").then(r => r.json()),
      fetch("/api/requests/my-pickups").then(r => r.json()),
    ])
    setRequests(a.requests || [])
    setMyPickups(m.requests || [])
    setLoading(false)
  }

  async function acceptRequest(id) {
    const res = await fetch("/api/requests/" + id + "/accept", { method: "POST" })
    if (res.ok) fetchData()
  }

  async function completeRequest(id, weight) {
    if (!weight) return
    const res = await fetch("/api/requests/" + id + "/complete", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actualWeight: parseFloat(weight) }),
    })
    if (res.ok) { const d = await res.json(); alert("Selesai! Household mendapat " + d.pointsEarned + " poin"); fetchData() }
  }

  if (status === "loading") return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",color:"#9ca3af"}}>Memuat...</div>

  const tabs = [
    { key: "available", label: "Request Tersedia", count: requests.length },
    { key: "mypickups", label: "Pickup Saya", count: myPickups.length },
  ]

  return (
    <div style={{minHeight:"100vh",background:"#f9fafb"}}>
      <div style={{background:"#0f2d13",padding:"28px 24px 60px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,opacity:0.04}}>
          {["♻","🚛","📦","♻","🌿","🚛","♻","📦"].map((e,i) => (
            <span key={i} style={{position:"absolute",fontSize: i%2===0?"80px":"50px",top: (i*13)%80+"%",left: (i*15)%90+"%",transform:"rotate("+(i*23)+"deg)"}}>{e}</span>
          ))}
        </div>
        <Navbar userName={session?.user?.name || ""} role="COLLECTOR" />
        <div style={{maxWidth:"860px",margin:"24px auto 0",position:"relative",zIndex:1}}>
          <div style={{display:"inline-block",border:"1px solid rgba(134,239,172,0.3)",color:"#86efac",fontSize:"10px",padding:"3px 10px",borderRadius:"20px",fontWeight:"600",marginBottom:"12px",letterSpacing:"1px"}}>DASHBOARD PENGEPUL</div>
          <h1 style={{color:"#fff",fontSize:"28px",fontWeight:"700",marginBottom:"4px",letterSpacing:"-0.5px"}}>Halo, {session?.user?.name?.split(" ")[0]}!</h1>
          <p style={{color:"#6b7280",fontSize:"13px"}}>Ambil request sampah dan kelola pickup harianmu</p>
        </div>
      </div>

      <div style={{maxWidth:"860px",margin:"-32px auto 0",padding:"0 24px 32px",position:"relative",zIndex:2}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"20px"}}>
          {[
            { label: "REQUEST TERSEDIA", value: requests.length, sub: "menunggu diambil", accent: true },
            { label: "SEDANG DIPROSES", value: myPickups.filter(r => r.status !== "COMPLETED").length, sub: "pickup aktif", accent: false },
          ].map(s => (
            <div key={s.label} style={{background:"#fff",borderRadius:"10px",padding:"16px 18px",border:"1px solid #e5e7eb",borderLeft: s.accent ? "3px solid #16a34a" : "1px solid #e5e7eb",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
              <div style={{fontSize:"10px",fontWeight:"700",color:"#9ca3af",letterSpacing:"0.8px",marginBottom:"8px"}}>{s.label}</div>
              <div style={{fontSize:"26px",fontWeight:"700",color:"#111",lineHeight:"1",marginBottom:"3px"}}>{s.value}</div>
              <div style={{fontSize:"11px",color:"#9ca3af"}}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"10px",overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
          <div style={{borderBottom:"1px solid #f3f4f6",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex"}}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{padding:"13px 20px",fontSize:"12px",fontWeight:"600",border:"none",background:"transparent",cursor:"pointer",borderBottom: tab===t.key ? "2px solid #111" : "2px solid transparent",color: tab===t.key ? "#111" : "#9ca3af",display:"flex",alignItems:"center",gap:"6px"}}>
                  {t.label}
                  <span style={{fontSize:"10px",padding:"1px 6px",borderRadius:"8px",background: tab===t.key ? "#111" : "#f3f4f6",color: tab===t.key ? "#fff" : "#9ca3af"}}>{t.count}</span>
                </button>
              ))}
            </div>
            <button onClick={() => router.push("/collector/batch/new")}
              style={{margin:"0 16px",padding:"7px 14px",borderRadius:"5px",border:"none",background:"#16a34a",color:"#fff",fontSize:"11px",fontWeight:"600",cursor:"pointer"}}>
              + Listing Batch
            </button>
          </div>

          {loading ? (
            <div style={{padding:"40px",textAlign:"center",fontSize:"13px",color:"#9ca3af"}}>Memuat data...</div>
          ) : tab === "available" ? (
            requests.length === 0 ? (
              <div style={{padding:"52px 20px",textAlign:"center"}}>
                <div style={{width:"44px",height:"44px",background:"#f0fdf4",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:"20px"}}>📋</div>
                <p style={{fontSize:"13px",fontWeight:"700",color:"#374151",marginBottom:"4px"}}>Tidak ada request tersedia</p>
                <p style={{fontSize:"12px",color:"#9ca3af"}}>Request dari rumah tangga akan muncul di sini</p>
              </div>
            ) : (
              <div>
                {requests.map((req, i) => {
                  const types = JSON.parse(req.sampahTypes || "[]")
                  return (
                    <div key={req.id} style={{padding:"14px 20px",borderBottom: i < requests.length-1 ? "1px solid #f9fafb" : "none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{fontSize:"11px",color:"#9ca3af",marginBottom:"4px",textTransform:"capitalize"}}>{types.join(" / ")}</div>
                        <div style={{fontSize:"13px",fontWeight:"600",color:"#111",marginBottom:"2px"}}>{req.addressDetail}</div>
                        <div style={{fontSize:"11px",color:"#9ca3af"}}>Dari: {req.householdName}{req.estimatedWeight ? " · Est. " + req.estimatedWeight + " kg" : ""}</div>
                      </div>
                      <button onClick={() => acceptRequest(req.id)}
                        style={{padding:"8px 16px",borderRadius:"6px",border:"none",background:"#16a34a",color:"#fff",fontSize:"12px",fontWeight:"600",cursor:"pointer",whiteSpace:"nowrap",marginLeft:"16px"}}>
                        Ambil
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            myPickups.length === 0 ? (
              <div style={{padding:"52px 20px",textAlign:"center"}}>
                <div style={{width:"44px",height:"44px",background:"#f9fafb",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:"20px"}}>🚛</div>
                <p style={{fontSize:"13px",fontWeight:"700",color:"#374151",marginBottom:"4px"}}>Belum ada pickup</p>
                <p style={{fontSize:"12px",color:"#9ca3af"}}>Pickup yang kamu ambil akan muncul di sini</p>
              </div>
            ) : (
              <div>
                {myPickups.map(req => <PickupCard key={req.id} req={req} onComplete={completeRequest} />)}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}`;

fs.writeFileSync('app/(dashboard)/collector/page.tsx', collector, {encoding:'utf8'});
console.log('collector OK');
