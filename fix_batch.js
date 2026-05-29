const fs = require('fs');
fs.mkdirSync('app/(dashboard)/collector/batch/new', { recursive: true });

const page = `"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Navbar from "@/components/Navbar"

const WASTE_TYPES = [
  { id: "plastik", label: "Plastik", price: 2500 },
  { id: "kertas", label: "Kertas", price: 1500 },
  { id: "logam", label: "Logam", price: 5000 },
  { id: "kaca", label: "Kaca", price: 1000 },
  { id: "elektronik", label: "Elektronik", price: 8000 },
]

export default function NewBatchPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [form, setForm] = useState({ wasteType: "plastik", totalWeight: "", pricePerKg: "2500", location: "", description: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function handleTypeChange(type) {
    const found = WASTE_TYPES.find(w => w.id === type)
    setForm({ ...form, wasteType: type, pricePerKg: String(found ? found.price : 2000) })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch("/api/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wasteType: form.wasteType, totalWeight: parseFloat(form.totalWeight), pricePerKg: parseInt(form.pricePerKg), location: form.location, description: form.description }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || "Terjadi kesalahan"); setLoading(false); return }
    router.push("/collector")
  }

  const totalValue = parseFloat(form.totalWeight || "0") * parseInt(form.pricePerKg || "0")
  const S = { input: {width:"100%",padding:"10px 14px",borderRadius:"6px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none",boxSizing:"border-box",color:"#111"} }

  return (
    <div style={{minHeight:"100vh",background:"#f9fafb"}}>
      <Navbar userName={session?.user?.name || ""} role="COLLECTOR" />
      <div style={{maxWidth:"600px",margin:"0 auto",padding:"32px 24px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"24px"}}>
          <button onClick={() => router.back()} style={{background:"none",border:"none",fontSize:"13px",color:"#9ca3af",cursor:"pointer",padding:0}}>Kembali</button>
          <div style={{width:"1px",height:"14px",background:"#e5e7eb"}}></div>
          <h1 style={{fontSize:"18px",fontWeight:"700",color:"#111",letterSpacing:"-0.3px"}}>Listing Batch Material</h1>
        </div>

        {error && <div style={{fontSize:"13px",padding:"10px 14px",borderRadius:"6px",background:"#fef2f2",color:"#dc2626",marginBottom:"16px",border:"1px solid #fecaca"}}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"20px",marginBottom:"14px"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:"#374151",letterSpacing:"1px",marginBottom:"14px"}}>JENIS MATERIAL</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
              {WASTE_TYPES.map(type => (
                <button key={type.id} type="button" onClick={() => handleTypeChange(type.id)}
                  style={{padding:"11px 14px",borderRadius:"6px",border: form.wasteType === type.id ? "1.5px solid #111" : "1px solid #e5e7eb",background: form.wasteType === type.id ? "#f9fafb" : "#fff",textAlign:"left",cursor:"pointer"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:"13px",fontWeight:"600",color:"#111"}}>{type.label}</span>
                    {form.wasteType === type.id && <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#16a34a"}}></div>}
                  </div>
                  <p style={{fontSize:"11px",color:"#9ca3af",marginTop:"2px"}}>Rp {type.price.toLocaleString("id-ID")}/kg</p>
                </button>
              ))}
            </div>
          </div>

          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"20px",marginBottom:"14px"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:"#374151",letterSpacing:"1px",marginBottom:"16px"}}>DETAIL BATCH</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
              <div>
                <label style={{display:"block",fontSize:"11px",fontWeight:"700",color:"#374151",marginBottom:"5px",letterSpacing:"0.3px"}}>TOTAL BERAT (KG)</label>
                <input type="number" step="0.1" min="1" value={form.totalWeight} onChange={e => setForm({...form,totalWeight:e.target.value})} style={S.input} placeholder="50" required />
              </div>
              <div>
                <label style={{display:"block",fontSize:"11px",fontWeight:"700",color:"#374151",marginBottom:"5px",letterSpacing:"0.3px"}}>HARGA/KG (RP)</label>
                <input type="number" min="100" value={form.pricePerKg} onChange={e => setForm({...form,pricePerKg:e.target.value})} style={S.input} required />
              </div>
            </div>
            <div style={{marginBottom:"12px"}}>
              <label style={{display:"block",fontSize:"11px",fontWeight:"700",color:"#374151",marginBottom:"5px",letterSpacing:"0.3px"}}>LOKASI MATERIAL</label>
              <input type="text" value={form.location} onChange={e => setForm({...form,location:e.target.value})} style={S.input} placeholder="Gudang Bandung Utara" required />
            </div>
            <div>
              <label style={{display:"block",fontSize:"11px",fontWeight:"700",color:"#374151",marginBottom:"5px",letterSpacing:"0.3px"}}>DESKRIPSI (OPSIONAL)</label>
              <textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})} style={{...S.input,resize:"vertical"}} placeholder="Kondisi, kualitas sortiran..." rows={2} />
            </div>
          </div>

          {form.totalWeight && (
            <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"16px 20px",marginBottom:"14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:"10px",fontWeight:"700",color:"#374151",letterSpacing:"1px",marginBottom:"4px"}}>TOTAL NILAI BATCH</div>
                <div style={{fontSize:"22px",fontWeight:"700",color:"#111"}}>Rp {totalValue.toLocaleString("id-ID")}</div>
              </div>
              <div style={{fontSize:"11px",color:"#9ca3af",textAlign:"right"}}>
                <div>{form.totalWeight} kg</div>
                <div>x Rp {parseInt(form.pricePerKg||0).toLocaleString("id-ID")}/kg</div>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{width:"100%",padding:"12px",borderRadius:"6px",border:"none",background:loading?"#9ca3af":"#111",color:"#fff",fontSize:"13px",fontWeight:"600",cursor:loading?"not-allowed":"pointer"}}>
            {loading ? "Membuat listing..." : "Publish ke Marketplace Recycler"}
          </button>
        </form>
      </div>
    </div>
  )
}`;

fs.writeFileSync('app/(dashboard)/collector/batch/new/page.tsx', page, {encoding:'utf8'});
console.log('batch/new OK');
