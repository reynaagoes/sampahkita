const fs = require('fs');

const login = `"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await signIn("credentials", { email, password, redirect: false })
    if (res?.error) { setError("Email atau password salah"); setLoading(false); return }
    const session = await fetch("/api/auth/session").then(r => r.json())
    const role = session?.user?.role
    if (role === "HOUSEHOLD") router.push("/household")
    else if (role === "COLLECTOR") router.push("/collector")
    else if (role === "RECYCLER") router.push("/recycler")
    else if (role === "ADMIN") router.push("/admin")
    else router.push("/")
  }

  return (
    <div style={{minHeight:"100vh",background:"#fff",display:"flex"}}>
      <div style={{width:"420px",background:"#111",padding:"48px",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <div style={{width:"30px",height:"30px",background:"#16a34a",borderRadius:"6px",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:"700",fontSize:"12px"}}>CS</div>
          <span style={{color:"#fff",fontWeight:"700",fontSize:"16px"}}>CuanSampah</span>
        </div>
        <div>
          <div style={{display:"inline-block",background:"#16a34a",color:"#fff",fontSize:"10px",padding:"3px 10px",borderRadius:"4px",fontWeight:"600",marginBottom:"20px",letterSpacing:"0.5px"}}>PLATFORM EKONOMI SIRKULAR</div>
          <h1 style={{color:"#fff",fontSize:"32px",fontWeight:"700",lineHeight:"1.2",marginBottom:"14px",letterSpacing:"-0.5px"}}>Sampahmu,<br/>Cuanmu.</h1>
          <p style={{color:"#6b7280",fontSize:"14px",lineHeight:"1.7",marginBottom:"32px"}}>Platform yang menghubungkan rumah tangga, pengepul, dan industri daur ulang dalam satu ekosistem terintegrasi.</p>
          <div style={{borderTop:"1px solid #1f2937",paddingTop:"24px",display:"flex",flexDirection:"column",gap:"12px"}}>
            {[
              {code:"H", title:"Rumah Tangga", desc:"Jual sampah, kumpulkan poin"},
              {code:"C", title:"Pengepul", desc:"Ambil request di sekitarmu"},
              {code:"R", title:"Recycler", desc:"Beli batch material daur ulang"},
            ].map(item => (
              <div key={item.code} style={{display:"flex",alignItems:"center",gap:"12px"}}>
                <div style={{width:"28px",height:"28px",border:"1px solid #374151",borderRadius:"5px",display:"flex",alignItems:"center",justifyContent:"center",color:"#6b7280",fontSize:"11px",fontWeight:"700",flexShrink:0}}>{item.code}</div>
                <div>
                  <p style={{color:"#fff",fontSize:"12px",fontWeight:"600",marginBottom:"1px"}}>{item.title}</p>
                  <p style={{color:"#6b7280",fontSize:"11px"}}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p style={{color:"#374151",fontSize:"11px"}}>CuanSampah 2026 - II2210 Teknologi Platform ITB</p>
      </div>

      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"48px"}}>
        <div style={{width:"100%",maxWidth:"360px"}}>
          <h2 style={{fontSize:"24px",fontWeight:"700",color:"#111",marginBottom:"4px",letterSpacing:"-0.3px"}}>Masuk</h2>
          <p style={{fontSize:"13px",color:"#9ca3af",marginBottom:"28px"}}>Belum punya akun? <a href="/register" style={{color:"#16a34a",fontWeight:"600",textDecoration:"none"}}>Daftar gratis</a></p>

          {error && <div style={{fontSize:"13px",padding:"10px 14px",borderRadius:"6px",background:"#fef2f2",color:"#dc2626",marginBottom:"16px",border:"1px solid #fecaca"}}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{marginBottom:"14px"}}>
              <label style={{display:"block",fontSize:"12px",fontWeight:"600",color:"#374151",marginBottom:"6px",letterSpacing:"0.3px"}}>EMAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                style={{width:"100%",padding:"10px 14px",borderRadius:"6px",border:"1px solid #e5e7eb",fontSize:"14px",outline:"none",boxSizing:"border-box",color:"#111"}}
                placeholder="nama@email.com" required />
            </div>
            <div style={{marginBottom:"20px"}}>
              <label style={{display:"block",fontSize:"12px",fontWeight:"600",color:"#374151",marginBottom:"6px",letterSpacing:"0.3px"}}>PASSWORD</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                style={{width:"100%",padding:"10px 14px",borderRadius:"6px",border:"1px solid #e5e7eb",fontSize:"14px",outline:"none",boxSizing:"border-box",color:"#111"}}
                placeholder="Min. 8 karakter" required />
            </div>
            <button type="submit" disabled={loading}
              style={{width:"100%",padding:"11px",borderRadius:"6px",border:"none",background:loading?"#9ca3af":"#111",color:"#fff",fontSize:"14px",fontWeight:"600",cursor:loading?"not-allowed":"pointer"}}>
              {loading ? "Memverifikasi..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}`;

fs.writeFileSync('app/(auth)/login/page.tsx', login, {encoding:'utf8'});
console.log('login OK');
