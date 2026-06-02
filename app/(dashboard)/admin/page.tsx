"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navbar from "@/components/Navbar"

type PendingCollector = {
  id: string
  fullName: string
  email: string
  phone?: string | null
}

type RecentRequest = {
  id: string
  sampahTypes?: string | null
  status: string
  addressDetail?: string | null
  householdName?: string | null
  actualWeight?: number | string | null
}

const STATUS_DOT: Record<string, string> = {
  OPEN: "#f59e0b", ASSIGNED: "#3b82f6", COMPLETED: "#16a34a", CANCELLED: "#ef4444",
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({ users: 0, pending: 0, transactions: 0, totalPoints: 0 })
  const [pendingCollectors, setPending] = useState<PendingCollector[]>([])
  const [recentRequests, setRecent] = useState<RecentRequest[]>([])
  const [tab, setTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const role = String(session?.user?.role || "")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated" && role !== "ADMIN") router.replace(role === "HOUSEHOLD" ? "/household" : role === "COLLECTOR" ? "/collector" : "/recycler")
  }, [status, role, router])
  useEffect(() => { if (status === "authenticated" && role === "ADMIN") fetchData() }, [status, role])

  async function fetchData() {
    setLoading(true)
    const [s, c, r] = await Promise.all([
      fetch("/api/admin/stats").then(x => x.json()),
      fetch("/api/admin/collectors").then(x => x.json()),
      fetch("/api/admin/requests").then(x => x.json()),
    ])
    setStats(s)
    setPending(c.collectors || [])
    setRecent(r.requests || [])
    setLoading(false)
  }

  async function verify(collectorId: string, action: "APPROVED" | "REJECTED") {
    await fetch("/api/admin/collectors", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectorId, action }),
    })
    fetchData()
  }

  if (status !== "authenticated" || role !== "ADMIN") return <div className="page-loader">Memeriksa akses...</div>

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "verifikasi", label: "Verifikasi (" + stats.pending + ")" },
    { key: "transaksi", label: "Transaksi" },
  ]

  return (
    <div style={{minHeight:"100vh",background:"#f9fafb"}}>
      <Navbar userName={session?.user?.name || ""} role="ADMIN" />
      <div style={{maxWidth:"900px",margin:"0 auto",padding:"32px 24px"}}>
        <div style={{marginBottom:"24px"}}>
          <h1 style={{fontSize:"20px",fontWeight:"700",color:"#111",marginBottom:"2px",letterSpacing:"-0.3px"}}>Admin Dashboard</h1>
          <p style={{fontSize:"13px",color:"#9ca3af"}}>Monitor dan kelola platform CuanSampah</p>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"1px",background:"#e5e7eb",borderRadius:"8px",overflow:"hidden",marginBottom:"24px"}}>
          {[
            { label: "Total User", value: stats.users },
            { label: "Pending Verifikasi", value: stats.pending },
            { label: "Total Transaksi", value: stats.transactions },
            { label: "Poin Beredar", value: Number(stats.totalPoints).toLocaleString("id-ID") },
          ].map((s,i) => (
            <div key={s.label} style={{background:"#fff",padding:"18px 16px",borderBottom: i===0 ? "2px solid #16a34a" : "2px solid transparent"}}>
              <div style={{fontSize:"22px",fontWeight:"700",color:"#111",lineHeight:"1",marginBottom:"4px"}}>{s.value}</div>
              <div style={{fontSize:"10px",color:"#9ca3af"}}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"8px",overflow:"hidden"}}>
          <div style={{borderBottom:"1px solid #f3f4f6",display:"flex"}}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{padding:"13px 20px",fontSize:"12px",fontWeight:"600",border:"none",background:"transparent",cursor:"pointer",borderBottom: tab===t.key ? "2px solid #111" : "2px solid transparent",color: tab===t.key ? "#111" : "#9ca3af"}}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{padding:"20px"}}>
            {loading ? (
              <div style={{textAlign:"center",padding:"32px",fontSize:"13px",color:"#9ca3af"}}>Memuat...</div>
            ) : tab === "verifikasi" ? (
              pendingCollectors.length === 0 ? (
                <div style={{textAlign:"center",padding:"32px",fontSize:"13px",color:"#9ca3af"}}>Tidak ada collector pending</div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                  {pendingCollectors.map(c => (
                    <div key={c.id} style={{padding:"14px 16px",border:"1px solid #f3f4f6",borderRadius:"6px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <p style={{fontSize:"13px",fontWeight:"600",color:"#111",marginBottom:"2px"}}>{c.fullName}</p>
                        <p style={{fontSize:"11px",color:"#9ca3af"}}>{c.email} - {c.phone}</p>
                        <div style={{display:"flex",alignItems:"center",gap:"5px",marginTop:"4px"}}>
                          <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#f59e0b"}}></div>
                          <span style={{fontSize:"10px",color:"#374151"}}>Menunggu verifikasi</span>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:"8px"}}>
                        <button onClick={() => verify(c.id, "APPROVED")}
                          style={{padding:"7px 14px",borderRadius:"5px",border:"none",background:"#16a34a",color:"#fff",fontSize:"12px",fontWeight:"600",cursor:"pointer"}}>
                          Setujui
                        </button>
                        <button onClick={() => verify(c.id, "REJECTED")}
                          style={{padding:"7px 14px",borderRadius:"5px",border:"1px solid #e5e7eb",background:"#fff",color:"#ef4444",fontSize:"12px",fontWeight:"600",cursor:"pointer"}}>
                          Tolak
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : tab === "transaksi" ? (
              <div style={{display:"flex",flexDirection:"column",gap:"2px"}}>
                {recentRequests.map((req, i) => {
                  const types = JSON.parse(req.sampahTypes || "[]")
                  const dot = STATUS_DOT[req.status] || "#9ca3af"
                  return (
                    <div key={req.id} style={{padding:"12px 0",borderBottom: i < recentRequests.length-1 ? "1px solid #f9fafb" : "none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{fontSize:"11px",color:"#9ca3af",marginBottom:"3px"}}>{types.join(" / ")}</div>
                        <div style={{fontSize:"13px",fontWeight:"600",color:"#111",marginBottom:"2px"}}>{req.addressDetail}</div>
                        <div style={{fontSize:"11px",color:"#9ca3af"}}>Dari: {req.householdName}{req.actualWeight ? " - " + req.actualWeight + " kg" : ""}</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:"5px",whiteSpace:"nowrap"}}>
                        <div style={{width:"6px",height:"6px",borderRadius:"50%",background:dot}}></div>
                        <span style={{fontSize:"11px",color:"#374151"}}>{req.status}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
                <div style={{border:"1px solid #f3f4f6",borderRadius:"6px",padding:"16px"}}>
                  <div style={{fontSize:"10px",fontWeight:"700",color:"#374151",letterSpacing:"1px",marginBottom:"12px"}}>STATUS TRANSAKSI</div>
                  {["OPEN","ASSIGNED","COMPLETED","CANCELLED"].map(s => {
                    const count = recentRequests.filter(r => r.status === s).length
                    return (
                      <div key={s} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #f9fafb"}}>
                        <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                          <div style={{width:"6px",height:"6px",borderRadius:"50%",background:STATUS_DOT[s]||"#9ca3af"}}></div>
                          <span style={{fontSize:"12px",color:"#374151"}}>{s}</span>
                        </div>
                        <span style={{fontSize:"13px",fontWeight:"700",color:"#111"}}>{count}</span>
                      </div>
                    )
                  })}
                </div>
                <div style={{border:"1px solid #f3f4f6",borderRadius:"6px",padding:"16px"}}>
                  <div style={{fontSize:"10px",fontWeight:"700",color:"#374151",letterSpacing:"1px",marginBottom:"12px"}}>RINGKASAN PLATFORM</div>
                  {[
                    ["Total Request", recentRequests.length],
                    ["Selesai", recentRequests.filter(r => r.status === "COMPLETED").length],
                    ["Poin Beredar", Number(stats.totalPoints).toLocaleString("id-ID")],
                  ].map(([label, val]) => (
                    <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #f9fafb"}}>
                      <span style={{fontSize:"12px",color:"#374151"}}>{label}</span>
                      <span style={{fontSize:"13px",fontWeight:"700",color:"#111"}}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
