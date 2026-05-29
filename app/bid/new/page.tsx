"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Navbar from "@/components/Navbar"

export default function NewBidPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [form, setForm] = useState({ title: "", description: "", minPrice: "", maxPrice: "", priceStep: "" })
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!photo) { setError("Foto barang wajib diupload"); return }
    if (parseInt(form.maxPrice) <= parseInt(form.minPrice)) { setError("Harga maksimum harus lebih besar dari minimum"); return }
    setLoading(true)
    setError("")

    const formData = new FormData()
    formData.append("title", form.title)
    formData.append("description", form.description)
    formData.append("minPrice", form.minPrice)
    formData.append("maxPrice", form.maxPrice)
    formData.append("priceStep", form.priceStep)
    formData.append("photo", photo)

    const res = await fetch("/api/bid", { method: "POST", body: formData })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    router.push("/bid")
  }

  const S = { input: {width:"100%",padding:"10px 14px",borderRadius:"6px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none",boxSizing:"border-box",color:"#111"} }

  return (
    <div style={{minHeight:"100vh",background:"#f9fafb"}}>
      <Navbar userName={session?.user?.name || ""} role={session?.user?.role} />
      <div style={{maxWidth:"600px",margin:"0 auto",padding:"32px 24px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"24px"}}>
          <button onClick={() => router.back()} style={{background:"none",border:"none",fontSize:"13px",color:"#9ca3af",cursor:"pointer",padding:0}}>Kembali</button>
          <div style={{width:"1px",height:"14px",background:"#e5e7eb"}}></div>
          <h1 style={{fontSize:"18px",fontWeight:"700",color:"#111",letterSpacing:"-0.3px"}}>Jual Barang via Bid</h1>
        </div>

        {error && <div style={{fontSize:"13px",padding:"10px 14px",borderRadius:"6px",background:"#fef2f2",color:"#dc2626",marginBottom:"16px",border:"1px solid #fecaca"}}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"20px",marginBottom:"14px"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:"#374151",letterSpacing:"1px",marginBottom:"16px"}}>FOTO BARANG</div>
            <label style={{display:"block",cursor:"pointer"}}>
              {preview ? (
                <img src={preview} alt="preview" style={{width:"100%",height:"220px",objectFit:"cover",borderRadius:"6px",border:"1px solid #e5e7eb"}} />
              ) : (
                <div style={{width:"100%",height:"220px",border:"2px dashed #e5e7eb",borderRadius:"6px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#f9fafb"}}>
                  <div style={{fontSize:"32px",marginBottom:"8px"}}>📷</div>
                  <p style={{fontSize:"13px",fontWeight:"600",color:"#374151",marginBottom:"2px"}}>Klik untuk upload foto</p>
                  <p style={{fontSize:"11px",color:"#9ca3af"}}>JPG, PNG, WEBP - Max 5MB</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}} />
            </label>
            {preview && (
              <button type="button" onClick={() => { setPhoto(null); setPreview(null) }}
                style={{marginTop:"8px",fontSize:"12px",color:"#ef4444",background:"none",border:"none",cursor:"pointer",padding:0}}>
                Hapus foto
              </button>
            )}
          </div>

          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"20px",marginBottom:"14px"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:"#374151",letterSpacing:"1px",marginBottom:"16px"}}>DETAIL BARANG</div>
            <div style={{marginBottom:"12px"}}>
              <label style={{display:"block",fontSize:"11px",fontWeight:"700",color:"#374151",marginBottom:"5px",letterSpacing:"0.3px"}}>NAMA BARANG</label>
              <input type="text" value={form.title} onChange={e => setForm({...form,title:e.target.value})} style={S.input} placeholder="Contoh: Raket Tennis Wilson Pro" required />
            </div>
            <div>
              <label style={{display:"block",fontSize:"11px",fontWeight:"700",color:"#374151",marginBottom:"5px",letterSpacing:"0.3px"}}>DESKRIPSI</label>
              <textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})}
                style={{...S.input,resize:"vertical"}} placeholder="Kondisi barang, alasan jual, dll" rows={3} />
            </div>
          </div>

          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"20px",marginBottom:"14px"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:"#374151",letterSpacing:"1px",marginBottom:"16px"}}>PENGATURAN BID</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
              <div>
                <label style={{display:"block",fontSize:"11px",fontWeight:"700",color:"#374151",marginBottom:"5px",letterSpacing:"0.3px"}}>HARGA MINIMUM (Rp)</label>
                <input type="number" min="1000" value={form.minPrice} onChange={e => setForm({...form,minPrice:e.target.value})} style={S.input} placeholder="50000" required />
              </div>
              <div>
                <label style={{display:"block",fontSize:"11px",fontWeight:"700",color:"#374151",marginBottom:"5px",letterSpacing:"0.3px"}}>HARGA MAKSIMUM (Rp)</label>
                <input type="number" min="1000" value={form.maxPrice} onChange={e => setForm({...form,maxPrice:e.target.value})} style={S.input} placeholder="500000" required />
              </div>
            </div>
            <div>
              <label style={{display:"block",fontSize:"11px",fontWeight:"700",color:"#374151",marginBottom:"5px",letterSpacing:"0.3px"}}>KELIPATAN BID (Rp)</label>
              <input type="number" min="1000" value={form.priceStep} onChange={e => setForm({...form,priceStep:e.target.value})} style={S.input} placeholder="10000" required />
            </div>
            {form.minPrice && form.maxPrice && form.priceStep && (
              <div style={{marginTop:"12px",padding:"12px",background:"#f9fafb",borderRadius:"6px",fontSize:"12px",color:"#374151",border:"1px solid #f3f4f6"}}>
                Bid dimulai dari <strong>Rp {parseInt(form.minPrice).toLocaleString("id-ID")}</strong>, naik <strong>Rp {parseInt(form.priceStep).toLocaleString("id-ID")}</strong> tiap bid, max <strong>Rp {parseInt(form.maxPrice).toLocaleString("id-ID")}</strong>. Berlaku selama <strong>24 jam</strong>.
              </div>
            )}
          </div>

          <button type="submit" disabled={loading}
            style={{width:"100%",padding:"12px",borderRadius:"6px",border:"none",background:loading?"#9ca3af":"#111",color:"#fff",fontSize:"13px",fontWeight:"600",cursor:loading?"not-allowed":"pointer"}}>
            {loading ? "Membuat listing..." : "Publish Listing Bid"}
          </button>
        </form>
      </div>
    </div>
  )
}