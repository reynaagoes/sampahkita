
"use client"
import { CSSProperties, MouseEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Navbar from "@/components/Navbar"
import RoleGate from "@/components/RoleGate"

const WASTE_TYPES = [
  { id: "plastik",    label: "Plastik",    poin: 500,  desc: "Botol, kantong, wadah" },
  { id: "kertas",     label: "Kertas",     poin: 300,  desc: "Koran, kardus, buku" },
  { id: "logam",      label: "Logam",      poin: 800,  desc: "Kaleng, besi, tembaga" },
  { id: "kaca",       label: "Kaca",       poin: 400,  desc: "Botol kaca, cermin" },
  { id: "elektronik", label: "Elektronik", poin: 1000, desc: "HP, kabel, baterai" },
]

export default function NewRequestPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [form, setForm] = useState({ estimatedWeight: "", addressDetail: "", notes: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function toggleType(id: string) {
    setSelectedTypes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  async function handleSubmit(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    if (selectedTypes.length === 0) { setError("Pilih minimal satu jenis sampah"); return }
    setLoading(true)
    setError("")
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sampahTypes: JSON.stringify(selectedTypes), estimatedWeight: parseFloat(form.estimatedWeight) || null, addressDetail: form.addressDetail, notes: form.notes }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || "Terjadi kesalahan"); setLoading(false); return }
    router.push("/household")
  }

  const estPoints = selectedTypes.reduce((sum, t) => sum + (WASTE_TYPES.find(w => w.id === t)?.poin || 0), 0) * (parseFloat(form.estimatedWeight) || 1)
  const S: Record<"input", CSSProperties> = { input: {width:"100%",padding:"10px 14px",borderRadius:"6px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none",boxSizing:"border-box",color:"#111"} }

  return (
    <RoleGate allow={["HOUSEHOLD"]}>
    <div style={{minHeight:"100vh",background:"#f9fafb"}}>
      <Navbar userName={session?.user?.name || ""} role="HOUSEHOLD" />
      <div style={{maxWidth:"640px",margin:"0 auto",padding:"32px 24px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"24px"}}>
          <button onClick={() => router.back()} style={{background:"none",border:"none",fontSize:"13px",color:"#9ca3af",cursor:"pointer",padding:0}}>Kembali</button>
          <div style={{width:"1px",height:"14px",background:"#e5e7eb"}}></div>
          <div>
            <h1 style={{fontSize:"18px",fontWeight:"700",color:"#111",letterSpacing:"-0.3px"}}>Buat Request Sampah</h1>
          </div>
        </div>

        {error && <div style={{fontSize:"13px",padding:"10px 14px",borderRadius:"6px",background:"#fef2f2",color:"#dc2626",marginBottom:"16px",border:"1px solid #fecaca"}}>{error}</div>}

        <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"20px",marginBottom:"14px"}}>
          <div style={{fontSize:"10px",fontWeight:"700",color:"#374151",letterSpacing:"1px",marginBottom:"14px"}}>JENIS SAMPAH</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
            {WASTE_TYPES.map(type => (
              <button key={type.id} type="button" onClick={() => toggleType(type.id)}
                style={{padding:"12px 14px",borderRadius:"6px",border: selectedTypes.includes(type.id) ? "1.5px solid #111" : "1px solid #e5e7eb",background: selectedTypes.includes(type.id) ? "#f9fafb" : "#fff",textAlign:"left",cursor:"pointer",transition:"all 0.1s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"3px"}}>
                  <span style={{fontSize:"13px",fontWeight:"600",color:"#111"}}>{type.label}</span>
                  {selectedTypes.includes(type.id) && <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#16a34a",marginTop:"3px"}}></div>}
                </div>
                <p style={{fontSize:"11px",color:"#9ca3af",marginBottom:"4px"}}>{type.desc}</p>
                <p style={{fontSize:"11px",fontWeight:"600",color:"#16a34a"}}>{type.poin.toLocaleString()} poin/kg</p>
              </button>
            ))}
          </div>
        </div>

        <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"20px",marginBottom:"14px"}}>
          <div style={{fontSize:"10px",fontWeight:"700",color:"#374151",letterSpacing:"1px",marginBottom:"16px"}}>DETAIL PENJEMPUTAN</div>
          <div style={{marginBottom:"12px"}}>
            <label style={{display:"block",fontSize:"12px",fontWeight:"600",color:"#374151",marginBottom:"5px",letterSpacing:"0.3px"}}>ESTIMASI BERAT (KG)</label>
            <input type="number" step="0.1" min="0.1" value={form.estimatedWeight} onChange={e => setForm({...form, estimatedWeight: e.target.value})} style={S.input} placeholder="Contoh: 2.5" />
          </div>
          <div style={{marginBottom:"12px"}}>
            <label style={{display:"block",fontSize:"12px",fontWeight:"600",color:"#374151",marginBottom:"5px",letterSpacing:"0.3px"}}>ALAMAT PENJEMPUTAN</label>
            <textarea value={form.addressDetail} onChange={e => setForm({...form, addressDetail: e.target.value})} style={{...S.input,resize:"vertical"}} placeholder="Contoh: Jl. Merdeka No. 10, RT 03/RW 05" rows={3} required />
          </div>
          <div>
            <label style={{display:"block",fontSize:"12px",fontWeight:"600",color:"#374151",marginBottom:"5px",letterSpacing:"0.3px"}}>CATATAN (OPSIONAL)</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={{...S.input,resize:"vertical"}} placeholder="Contoh: Sampah ada di depan pagar" rows={2} />
          </div>
        </div>

        {selectedTypes.length > 0 && form.estimatedWeight && (
          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"16px 20px",marginBottom:"14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:"10px",fontWeight:"700",color:"#16a34a",letterSpacing:"1px",marginBottom:"4px"}}>ESTIMASI POIN</div>
              <div style={{fontSize:"24px",fontWeight:"700",color:"#111"}}>{Math.round(estPoints).toLocaleString("id-ID")} poin</div>
            </div>
            <div style={{width:"36px",height:"36px",border:"2px solid #16a34a",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{width:"18px",height:"18px",background:"#16a34a",borderRadius:"50%"}}></div>
            </div>
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading}
          style={{width:"100%",padding:"12px",borderRadius:"6px",border:"none",background:loading?"#9ca3af":"#111",color:"#fff",fontSize:"13px",fontWeight:"600",cursor:loading?"not-allowed":"pointer"}}>
          {loading ? "Mengirim..." : "Kirim Request"}
        </button>
      </div>
    </div>
    </RoleGate>
  )
}
