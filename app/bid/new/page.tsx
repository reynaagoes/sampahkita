"use client"
import { ChangeEvent, CSSProperties, FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Navbar from "@/components/Navbar"

export default function NewBidPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [form, setForm] = useState({ title: "", description: "", contactName: "", contactPhone: "", minPrice: "", maxPrice: "", priceStep: "" })
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 5)
    if (!files.length) return
    setPhotos(files)
    Promise.all(files.map((file) => new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "")
      reader.readAsDataURL(file)
    }))).then((items) => setPreviews(items.filter(Boolean)))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.contactName || !form.contactPhone) { setError("Nama dan nomor kontak wajib diisi"); return }
    if (parseInt(form.maxPrice) <= parseInt(form.minPrice)) { setError("Harga maksimum harus lebih besar dari minimum"); return }
    if (photos.length > 5) { setError("Upload maksimal 5 gambar"); return }
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          contactName: form.contactName.trim(),
          contactPhone: form.contactPhone.trim(),
          minPrice: form.minPrice,
          maxPrice: form.maxPrice,
          priceStep: form.priceStep,
          images: previews,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Terjadi kesalahan server"); setLoading(false); return }
      router.push("/bid")
    } catch {
      setError("Terjadi kesalahan server")
      setLoading(false)
    }
  }

  const S: Record<"input", CSSProperties> = { input: {width:"100%",padding:"10px 14px",borderRadius:"6px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none",boxSizing:"border-box",color:"#111"} }

  return (
    <div style={{minHeight:"100vh",background:"#f9fafb"}}>
      <Navbar userName={session?.user?.name || ""} role={session?.user?.role} />
      <div style={{maxWidth:"600px",margin:"0 auto",padding:"32px 24px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"24px"}}>
          <button onClick={() => router.back()} style={{background:"none",border:"none",fontSize:"13px",color:"#9ca3af",cursor:"pointer",padding:0}}>Kembali</button>
          <div style={{width:"1px",height:"14px",background:"#e5e7eb"}}></div>
          <h1 style={{fontSize:"18px",fontWeight:"700",color:"#111",letterSpacing:"-0.3px"}}>Jual Barang dengan Bid</h1>
        </div>

        {error && <div style={{fontSize:"13px",padding:"10px 14px",borderRadius:"6px",background:"#fef2f2",color:"#dc2626",marginBottom:"16px",border:"1px solid #fecaca"}}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"20px",marginBottom:"14px"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:"#374151",letterSpacing:"1px",marginBottom:"16px"}}>FOTO BARANG</div>
            <label style={{display:"block",cursor:"pointer"}}>
              {previews.length ? (
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px"}}>
                  {previews.map((preview, index) => <img key={preview} src={preview} alt={`preview ${index + 1}`} style={{width:"100%",height:"110px",objectFit:"cover",borderRadius:"6px",border:"1px solid #e5e7eb"}} />)}
                </div>
              ) : (
                <div style={{width:"100%",height:"220px",border:"2px dashed #e5e7eb",borderRadius:"6px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#f9fafb"}}>
                  <div style={{fontSize:"18px",fontWeight:"700",color:"#16a34a",marginBottom:"8px"}}>IMG</div>
                  <p style={{fontSize:"13px",fontWeight:"600",color:"#374151",marginBottom:"2px"}}>Klik untuk mengunggah foto</p>
                  <p style={{fontSize:"11px",color:"#9ca3af"}}>JPG, PNG, WEBP - 1 sampai 5 gambar</p>
                </div>
              )}
              <input type="file" accept="image/*" multiple onChange={handlePhoto} style={{display:"none"}} />
            </label>
            {previews.length > 0 && (
              <button type="button" onClick={() => { setPhotos([]); setPreviews([]) }}
                style={{marginTop:"8px",fontSize:"12px",color:"#ef4444",background:"none",border:"none",cursor:"pointer",padding:0}}>
                Hapus foto
              </button>
            )}
          </div>

          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"20px",marginBottom:"14px"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:"#374151",letterSpacing:"1px",marginBottom:"16px"}}>DETAIL BARANG</div>
            <div style={{marginBottom:"12px"}}>
              <label style={{display:"block",fontSize:"11px",fontWeight:"700",color:"#374151",marginBottom:"5px",letterSpacing:"0.3px"}}>NAMA BARANG</label>
              <input type="text" value={form.title} onChange={e => setForm({...form,title:e.target.value})} style={S.input} placeholder="Contoh: Raket tenis Wilson Pro" required />
            </div>
            <div>
              <label style={{display:"block",fontSize:"11px",fontWeight:"700",color:"#374151",marginBottom:"5px",letterSpacing:"0.3px"}}>DESKRIPSI</label>
              <textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})}
                style={{...S.input,resize:"vertical"}} placeholder="Kondisi barang, alasan dijual, dan informasi lain" rows={3} />
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginTop:"12px"}}>
              <div>
                <label style={{display:"block",fontSize:"11px",fontWeight:"700",color:"#374151",marginBottom:"5px",letterSpacing:"0.3px"}}>NAMA KONTAK</label>
                <input type="text" value={form.contactName} onChange={e => setForm({...form,contactName:e.target.value})} style={S.input} placeholder="Nama penjual" required />
              </div>
              <div>
                <label style={{display:"block",fontSize:"11px",fontWeight:"700",color:"#374151",marginBottom:"5px",letterSpacing:"0.3px"}}>NOMOR KONTAK</label>
                <input type="tel" value={form.contactPhone} onChange={e => setForm({...form,contactPhone:e.target.value})} style={S.input} placeholder="081234567890" required />
              </div>
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
                Bid dimulai dari <strong>Rp {parseInt(form.minPrice).toLocaleString("id-ID")}</strong>, naik <strong>Rp {parseInt(form.priceStep).toLocaleString("id-ID")}</strong> setiap bid, maksimal <strong>Rp {parseInt(form.maxPrice).toLocaleString("id-ID")}</strong>. Listing aktif selama <strong>24 jam</strong>.
              </div>
            )}
          </div>

          <button type="submit" disabled={loading}
            style={{width:"100%",padding:"12px",borderRadius:"6px",border:"none",background:loading?"#9ca3af":"#111",color:"#fff",fontSize:"13px",fontWeight:"600",cursor:loading?"not-allowed":"pointer"}}>
            {loading ? "Membuat listing..." : "Publikasikan Listing"}
          </button>
        </form>
      </div>
    </div>
  )
}
