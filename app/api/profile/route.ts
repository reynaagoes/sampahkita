import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getAppSession } from "@/lib/auth-session"

export async function GET() {
  const session = await getAppSession()
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [users] = await pool.execute(
    "SELECT fullName, email, role, phone, address, isVerified, avatarUrl FROM users WHERE email = ?",
    [session.user.email]
  ) as any[]

  if (!users[0]) return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 })
  return NextResponse.json({ profile: users[0] })
}

export async function PATCH(req: Request) {
  const session = await getAppSession()
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { fullName, email, phone, address } = await req.json()
  if (!String(fullName || "").trim() || !String(email || "").trim()) {
    return NextResponse.json({ error: "Nama dan email wajib diisi" }, { status: 400 })
  }

  const [existing] = await pool.execute(
    "SELECT id FROM users WHERE email = ? AND email <> ?",
    [String(email).trim(), session.user.email]
  ) as any[]
  if (existing.length) return NextResponse.json({ error: "Email sudah digunakan akun lain" }, { status: 409 })

  await pool.execute(
    "UPDATE users SET fullName = ?, email = ?, phone = ?, address = ?, updatedAt = NOW() WHERE email = ?",
    [String(fullName).trim(), String(email).trim(), String(phone || "").trim() || null, String(address || "").trim() || null, session.user.email]
  )

  return NextResponse.json({ message: "Profil berhasil diperbarui", emailChanged: String(email).trim() !== session.user.email })
}
