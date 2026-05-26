import { NextResponse } from "next/server"
import pool from "@/lib/db"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: Request) {
  try {
    const { email, password, fullName, role, phone } = await req.json()
    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 })
    }
    const [existing] = await pool.execute("SELECT id FROM users WHERE email = ?", [email]) as any[]
    if (existing.length > 0) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 })
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const userId = uuidv4()
    await pool.execute(
      "INSERT INTO users (id, email, password, fullName, role, phone, isVerified, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [userId, email, hashedPassword, fullName, role, phone || null, false]
    )
    if (role === "COLLECTOR") {
      await pool.execute(
        "INSERT INTO collector_verifications (id, collectorId, status, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())",
        [uuidv4(), userId, "PENDING"]
      )
    }
    return NextResponse.json({ message: "Registrasi berhasil", userId }, { status: 201 })
  } catch (error) {
    console.error("REGISTER ERROR:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
