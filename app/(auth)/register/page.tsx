"use client"
import { CSSProperties, FormEvent, useState } from "react"
import { useRouter } from "next/navigation"

const ROLES = [
  { value: "HOUSEHOLD", code: "H", label: "Rumah Tangga", desc: "Saya ingin menjual sampah dan kumpulkan poin" },
  { value: "COLLECTOR", code: "C", label: "Pengepul Sampah", desc: "Saya mengumpulkan dan mendistribusikan sampah" },
  { value: "RECYCLER",  code: "R", label: "Industri Daur Ulang", desc: "Saya membeli material untuk diolah kembali" },
]

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "", role: "HOUSEHOLD" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    router.push("/login")
  }

  const S: Record<"label" | "input", CSSProperties> = {
    label: {display:"block",fontSize:"12px",fontWeight:"600",color:"#374151",marginBottom:"6px",letterSpacing:"0.3px"},
    input: {width:"100%",padding:"10px 14px",borderRadius:"6px",border:"1px solid #e5e7eb",fontSize:"14px",outline:"none",boxSizing:"border-box",color:"#111"},
  }

  return (
    <div style={{minHeight:"100vh",background:"#f9fafb",display:"flex",alignItems:"center",justifyContent:"center",padding:"32px 16px"}}>
      <div style={{width:"100%",maxWidth:"480px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px",justifyContent:"center",marginBottom:"28px"}}>
          <div style={{width:"30px",height:"30px",background:"#16a34a",borderRadius:"6px",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:"700",fontSize:"12px"}}>CS</div>
          <span style={{fontWeight:"700",fontSize:"16px",color:"#111"}}>CuanSampah</span>
        </div>

        <div style={{background:"#fff",borderRadius:"10px",border:"1px solid #e5e7eb",padding:"28px"}}>
          <h2 style={{fontSize:"20px",fontWeight:"700",color:"#111",marginBottom:"4px",letterSpacing:"-0.3px"}}>Buat akun</h2>
          <p style={{fontSize:"13px",color:"#9ca3af",marginBottom:"20px"}}>Bergabung dan mulai hasilkan cuan dari sampah</p>

          {error && <div style={{fontSize:"13px",padding:"10px 14px",borderRadius:"6px",background:"#fef2f2",color:"#dc2626",marginBottom:"16px",border:"1px solid #fecaca"}}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{marginBottom:"16px"}}>
              <label style={S.label}>DAFTAR SEBAGAI</label>
              <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                {ROLES.map(r => (
                  <label key={r.value} style={{display:"flex",alignItems:"center",gap:"12px",padding:"11px 14px",borderRadius:"6px",border: form.role === r.value ? "1.5px solid #111" : "1px solid #e5e7eb",cursor:"pointer",background: form.role === r.value ? "#f9fafb" : "#fff"}}>
                    <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={e => setForm({...form, role: e.target.value})} style={{display:"none"}} />
                    <div style={{width:"26px",height:"26px",borderRadius:"5px",border: form.role === r.value ? "none" : "1px solid #d1d5db",background: form.role === r.value ? "#111" : "transparent",display:"flex",alignItems:"center",justifyContent:"center",color: form.role === r.value ? "#fff" : "#6b7280",fontSize:"11px",fontWeight:"700",flexShrink:0}}>{r.code}</div>
                    <div>
                      <p style={{fontSize:"13px",fontWeight:"600",color:"#111",marginBottom:"1px"}}>{r.label}</p>
                      <p style={{fontSize:"11px",color:"#9ca3af"}}>{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
              <div>
                <label style={S.label}>NAMA LENGKAP</label>
                <input type="text" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} style={S.input} placeholder="John Doe" required />
              </div>
              <div>
                <label style={S.label}>NO. TELEPON</label>
                <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={S.input} placeholder="08xx" />
              </div>
            </div>
            <div style={{marginBottom:"12px"}}>
              <label style={S.label}>EMAIL</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={S.input} placeholder="email@example.com" required />
            </div>
            <div style={{marginBottom:"20px"}}>
              <label style={S.label}>PASSWORD</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={S.input} placeholder="Min. 8 karakter" required />
            </div>

            <button type="submit" disabled={loading}
              style={{width:"100%",padding:"11px",borderRadius:"6px",border:"none",background:loading?"#9ca3af":"#111",color:"#fff",fontSize:"14px",fontWeight:"600",cursor:loading?"not-allowed":"pointer"}}>
              {loading ? "Mendaftar..." : "Daftar Sekarang"}
            </button>
          </form>
        </div>

        <p style={{textAlign:"center",fontSize:"13px",color:"#9ca3af",marginTop:"16px"}}>
          Sudah punya akun? <a href="/login" style={{color:"#111",fontWeight:"600",textDecoration:"none"}}>Masuk</a>
        </p>
      </div>
    </div>
  )
}
