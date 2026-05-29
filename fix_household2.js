const fs = require('fs');

const household = `"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navbar from "@/components/Navbar"

const STATUS = {
  OPEN:      { label: "Menunggu Pengepul", dot: "#f59e0b" },
  ASSIGNED:  { label: "Dalam Perjalanan",  dot: "#3b82f6" },
  PICKED_UP: { label: "Sedang Diproses",   dot: "#8b5cf6" },
  COMPLETED: { label: "Selesai",           dot: "#16a34a" },
  CANCELLED: { label: "Dibatalkan",        dot: "#ef4444" },
}

export default function HouseholdDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState([])
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])
  useEffect(() => {
    if (status !== "authenticated") return
    Promise.all([
      fetch("/api/requests").then(r => r.json()),
      fetch("/api/points").then(r => r.json()),
    ]).then(([req, pt]) => {
      setRequests(req.requests || [])
      setPoints(pt.total || 0)
      setLoading(false)
    })
  }, [status])

  if (status === "loading") return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#fff",fontSize:"13px",color:"#9ca3af"}}>Memuat...</div>

  const active = requests.filter(r => ["OPEN","ASSIGNED","PICKED_UP"].includes(r.status)).length
  const done = requests.filter(r => r.status === "COMPLETED").length
  const co2 = (done * 2.5).toFixed(1)

  return (
    <div style={{minHeight:"100vh",background:"#f9fafb"}}>
      <Navbar userName={session?.user?.name || ""} role="HOUSEHOLD" />
      <div style={{maxWidth:"860px",margin:"0 auto",padding:"32px 24px"}}>

        <div style={{marginBottom:"24px"}}>
          <h1 style={{fontSize:"20px",fontWeight:"700",color:"#111",marginBottom:"2px",letterSpacing:"-0.3px"}}>Dashboard</h1>
          <p style={{fontSize:"13px",color:"#9ca3af"}}>Kelola sampahmu dan pantau poin yang terkumpul</p>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1px",background:"#e5e7eb",borderRadius:"8px",overflow:"hidden",marginBottom:"24px"}}>
          {[
            { label: "Total Poin", value: Number(points).toLocaleString("id-ID") },
            { label: "Request Aktif", value: active },
            { label: "Total Selesai", value: done },
          ].map((s,i) => (
            <div key={s.label} style={{background:"#fff",padding:"20px 18px",borderBottom: i===0 ? "2px solid #16a34a" : "2px solid transparent"}}>
              <div style={{fontSize:"26px",fontWeight:"700",color:"#111",lineHeight:"1",marginBottom:"4px"}}>{s.value}</div>
              <div style={{fontSize:"11px",color:"#9ca3af"}}>{s.label}</div>
            </div>
          ))}
        </div>

        {parseFloat(co2) > 0 && (
          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"16px 20px",marginBottom:"20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:"10px",fontWeight:"700",color:"#16a34a",letterSpacing:"1px",marginBottom:"4px"}}>DAMPAK LINGKUNGANMU</div>
              <div style={{fontSize:"20px",fontWeight:"700",color:"#111"}}>{co2} kg CO2 diselamatkan</div>
              <div style={{fontSize:"11px",color:"#9ca3af",marginTop:"2px"}}>bulan ini</div>
            </div>
            <div style={{width:"48px",height:"48px",border:"2px solid #16a34a",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{width:"28px",height:"28px",background:"#16a34a",borderRadius:"50%"}}></div>
            </div>
          </div>
        )}

        <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"8px",overflow:"hidden"}}>
          <div style={{padding:"14px 20px",borderBottom:"1px solid #f3f4f6",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:"13px",fontWeight:"700",color:"#111"}}>Request Sampah</div>
              <div style={{fontSize:"11px",color:"#9ca3af",marginTop:"1px"}}>Riwayat permintaan penjemputan</div>
            </div>
            <button onClick={() => router.push("/household/request/new")}
              style={{background:"#16a34a",color:"#fff",border:"none",padding:"8px 16px",borderRadius:"6px",fontSize:"12px",fontWeight:"600",cursor:"pointer"}}>
              + Buat Request
            </button>
          </div>

          {loading ? (
            <div style={{padding:"40px",textAlign:"center",fontSize:"13px",color:"#9ca3af"}}>Memuat data...</div>
          ) : requests.length === 0 ? (
            <div style={{padding:"48px",textAlign:"center"}}>
              <div style={{width:"40px",height:"40px",border:"2px solid #e5e7eb",borderRadius:"50%",margin:"0 auto 12px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:"20px",height:"20px",background:"#f3f4f6",borderRadius:"50%"}}></div>
              </div>
              <p style={{fontSize:"13px",fontWeight:"600",color:"#374151",marginBottom:"4px"}}>Belum ada request</p>
              <p style={{fontSize:"12px",color:"#9ca3af"}}>Buat request pertama untuk mulai mengumpulkan poin</p>
            </div>
          ) : (
            <div>
              {requests.map((req, i) => {
                const types = JSON.parse(req.sampahTypes || "[]")
                const s = STATUS[req.status] || STATUS.OPEN
                return (
                  <div key={req.id} style={{padding:"14px 20px",borderBottom: i < requests.length-1 ? "1px solid #f9fafb" : "none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:"11px",color:"#9ca3af",marginBottom:"4px"}}>{types.join(" / ")}</div>
                      <div style={{fontSize:"13px",fontWeight:"600",color:"#111",marginBottom:"2px"}}>{req.addressDetail}</div>
                      <div style={{fontSize:"11px",color:"#9ca3af"}}>
                        {req.estimatedWeight ? "Est. " + req.estimatedWeight + " kg" : ""}
                        {req.actualWeight ? " · Aktual " + req.actualWeight + " kg" : ""}
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:"6px",whiteSpace:"nowrap"}}>
                      <div style={{width:"6px",height:"6px",borderRadius:"50%",background:s.dot,flexShrink:0}}></div>
                      <span style={{fontSize:"11px",color:"#374151",fontWeight:"500"}}>{s.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}`;

fs.writeFileSync('app/(dashboard)/household/page.tsx', household, {encoding:'utf8'});
console.log('household OK');
