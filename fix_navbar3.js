const fs = require('fs');
const navbar = `"use client"
import { signOut } from "next-auth/react"
import Link from "next/link"

const ROLE_LABEL = {
  HOUSEHOLD: "Rumah Tangga",
  COLLECTOR: "Pengepul",
  RECYCLER: "Recycler",
  ADMIN: "Admin",
}

export default function Navbar({ userName, role }) {
  const dashPath = role === "COLLECTOR" ? "/collector" : role === "RECYCLER" ? "/recycler" : role === "ADMIN" ? "/admin" : "/household"
  return (
    <nav style={{background:"#111",padding:"0 28px",height:"58px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
      <div style={{display:"flex",alignItems:"center",gap:"20px"}}>
        <Link href={dashPath} style={{display:"flex",alignItems:"center",gap:"8px",textDecoration:"none"}}>
          <div style={{width:"30px",height:"30px",background:"#16a34a",borderRadius:"6px",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:"700",fontSize:"12px"}}>CS</div>
          <span style={{color:"#fff",fontWeight:"700",fontSize:"16px",letterSpacing:"-0.3px"}}>CuanSampah</span>
        </Link>
        {role && <span style={{background:"#16a34a",color:"#fff",fontSize:"10px",padding:"3px 9px",borderRadius:"4px",fontWeight:"600"}}>{ROLE_LABEL[role] || role}</span>}
        <Link href="/bid" style={{color:"#9ca3af",fontSize:"13px",textDecoration:"none",fontWeight:"500",display:"flex",alignItems:"center",gap:"4px"}}>
          <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"#f59e0b",display:"inline-block"}}></span>
          PasarCuan
        </Link>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
        {userName && <span style={{color:"#9ca3af",fontSize:"13px"}}>Halo, <span style={{color:"#fff",fontWeight:"500"}}>{userName}</span></span>}
        <button onClick={() => signOut({ callbackUrl: "/login" })} style={{background:"transparent",color:"#9ca3af",border:"1px solid #374151",padding:"6px 14px",borderRadius:"5px",fontSize:"12px",cursor:"pointer"}}>Keluar</button>
      </div>
    </nav>
  )
}`;
fs.writeFileSync('components/Navbar.tsx', navbar, {encoding:'utf8'});
console.log('Navbar OK');
