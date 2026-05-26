"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navbar from "@/components/Navbar"
const STATUS = {
  OPEN:      { label: "Menunggu Pengepul", bg: "#fef9c3", color: "#854d0e" },
  ASSIGNED:  { label: "Dalam Perjalanan",  bg: "#dbeafe", color: "#1e40af" },
  PICKED_UP: { label: "Sedang Diproses",   bg: "#ede9fe", color: "#5b21b6" },
  COMPLETED: { label: "Selesai",           bg: "#dcfce7", color: "#166534" },
  CANCELLED: { label: "Dibatalkan",        bg: "#fee2e2", color: "#991b1b" },
}
const WASTE = {
  plastik:    ["#dcfce7","#166534"],
  kertas:     ["#fef9c3","#854d0e"],
  logam:      ["#f1f5f9","#334155"],
  kaca:       ["#cffafe","#155e75"],
  elektronik: ["#ede9fe","#5b21b6"],
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
  if (status === "loading") return <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>Memuat...</div>
  const active = requests.filter(r => ["OPEN","ASSIGNED","PICKED_UP"].includes(r.status)).length
  const done = requests.filter(r => r.status === "COMPLETED").length
  const co2 = (done * 2.5).toFixed(1)
  return (
    <div style={{minHeight:"100vh",background:"#f8fafc"}}>
      <Navbar userName={session?.user?.name || ""} role="HOUSEHOLD" />
      <div style={{maxWidth:"900px",margin:"0 auto",padding:"24px"}}>
        <div style={{marginBottom:"20px"}}><h1 style={{fontSize:"20px",fontWeight:"700",color:"#0f172a",marginBottom:"4px"}}>Dashboard</h1><p style={{fontSize:"13px",color:"#64748b"}}>Kelola sampahmu dan pantau poin yang terkumpul</p></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px",marginBottom:"20px"}}>
          {[
            { label: "Total Poin", value: Number(points).toLocaleString("id-ID"), bg: "#f0fdf4", color: "#16a34a" },
            { label: "Request Aktif", value: active, bg: "#fef9c3", color: "#d97706" },
            { label: "Total Selesai", value: done, bg: "#ede9fe", color: "#7c3aed" },
          ].map(s => (
            <div key={s.label} style={{background:"#fff",borderRadius:"12px",padding:"16px",border:"1px solid #e2e8f0"}}>
              <div style={{width:"36px",height:"36px",borderRadius:"8px",background:s.bg,marginBottom:"10px"}}></div>
              <div style={{fontSize:"28px",fontWeight:"700",color:s.color,lineHeight:"1"}}>{s.value}</div>
              <div style={{fontSize:"12px",color:"#64748b",marginTop:"4px"}}>{s.label}</div>
            </div>
          ))}
        </div>
        {parseFloat(co2) > 0 && (
          <div style={{background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",borderRadius:"12px",padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px",border:"1px solid #bbf7d0"}}>
            <div>
              <div style={{fontSize:"11px",fontWeight:"700",color:"#16a34a",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"4px"}}>Dampak Lingkunganmu</div>
              <div style={{fontSize:"22px",fontWeight:"700",color:"#14532d"}}>{co2} kg CO2</div>
              <div style={{fontSize:"12px",color:"#166534",marginTop:"2px"}}>ekuivalen karbon diselamatkan</div>
            </div>
            <div style={{fontSize:"36px"}}>Bumi</div>
          </div>
        )}
        <div style={{background:"#fff",borderRadius:"12px",border:"1px solid #e2e8f0",overflow:"hidden"}}>
          <div style={{padding:"14px 16px",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:"14px",fontWeight:"700",color:"#0f172a"}}>Request Sampah Saya</div><div style={{fontSize:"12px",color:"#94a3b8",marginTop:"1px"}}>Riwayat permintaan penjemputan</div></div>
            <button onClick={() => router.push("/household/request/new")} style={{background:"#16a34a",color:"#fff",border:"none",padding:"8px 16px",borderRadius:"8px",fontSize:"13px",fontWeight:"600",cursor:"pointer"}}>+ Buat Request</button>
          </div>
          <div style={{padding:"12px"}}>
            {loading ? (
              <div style={{textAlign:"center",padding:"40px",color:"#94a3b8",fontSize:"13px"}}>Memuat data...</div>
            ) : requests.length === 0 ? (
              <div style={{textAlign:"center",padding:"40px"}}>
                <div style={{fontSize:"32px",marginBottom:"8px"}}>Mulai</div>
                <p style={{fontSize:"14px",fontWeight:"600",color:"#64748b",marginBottom:"4px"}}>Belum ada request</p>
                <p style={{fontSize:"12px",color:"#94a3b8"}}>Buat request pertama untuk mulai mengumpulkan poin</p>
              </div>
            ) : (
              <div>
                {requests.map((req) => {
                  const types = JSON.parse(req.sampahTypes || "[]")
                  const s = STATUS[req.status] || STATUS.OPEN
                  return (
                    <div key={req.id} style={{padding:"12px",borderRadius:"8px",border:"1px solid #f1f5f9",marginBottom:"8px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{display:"flex",gap:"6px",marginBottom:"6px"}}>
                          {types.map((t) => {
                            const [bg, color] = WASTE[t] || ["#f3f4f6","#374151"]
                            return <span key={t} style={{fontSize:"11px",padding:"2px 8px",borderRadius:"20px",fontWeight:"600",background:bg,color:color,textTransform:"capitalize"}}>{t}</span>
                          })}
                        </div>
                        <p style={{fontSize:"13px",fontWeight:"600",color:"#1e293b"}}>{req.addressDetail}</p>
                        <p style={{fontSize:"11px",color:"#94a3b8",marginTop:"3px"}}>{req.estimatedWeight ? "Est. " + req.estimatedWeight + " kg" : ""}{req.actualWeight ? " - Aktual " + req.actualWeight + " kg" : ""}</p>
                      </div>
                      <span style={{fontSize:"11px",padding:"4px 10px",borderRadius:"20px",fontWeight:"600",background:s.bg,color:s.color,whiteSpace:"nowrap",marginLeft:"12px"}}>{s.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}