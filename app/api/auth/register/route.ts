import { NextResponse } from "next/server"
import pool from "@/lib/db"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = String(body.email || "").trim().toLowerCase()
    const password = String(body.password || "")
    const fullName = String(body.fullName || "").trim()
    const phone = String(body.phone || "").trim()
    const address = String(body.address || "").trim()
    const normalizedRole = String(body.role || "").toUpperCase().trim()

    if (!fullName) {
      return NextResponse.json({ error: "Nama lengkap wajib diisi" }, { status: 400 })
    }
    if (!email) {
      return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 })
    }
    if (!password) {
      return NextResponse.json({ error: "Password wajib diisi" }, { status: 400 })
    }
    if (!phone) {
      return NextResponse.json({ error: "No. telepon wajib diisi" }, { status: 400 })
    }
    if (!normalizedRole) {
      return NextResponse.json({ error: "Role wajib dipilih" }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password minimal 8 karakter" }, { status: 400 })
    }
    if (!["HOUSEHOLD", "COLLECTOR", "RECYCLER"].includes(normalizedRole)) {
      return NextResponse.json({ error: "Role registrasi tidak valid" }, { status: 400 })
    }
    const [existing] = await pool.execute("SELECT id FROM users WHERE email = ?", [email]) as any[]
    if (existing.length > 0) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 })
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const userId = uuidv4()
    const isVerified = normalizedRole === "HOUSEHOLD"
    await pool.execute(
      "INSERT INTO users (id, email, password, fullName, role, phone, address, isVerified, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [userId, email, hashedPassword, fullName, normalizedRole, phone, address || null, isVerified]
    )
    if (normalizedRole === "COLLECTOR") {
      await pool.execute(
        "INSERT INTO collector_verifications (id, collectorId, status, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())",
        [uuidv4(), userId, "PENDING"]
      )
    }
    return NextResponse.json({ message: "Registrasi berhasil", userId }, { status: 201 })
  } catch (error) {
    console.error("REGISTER ERROR:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}
