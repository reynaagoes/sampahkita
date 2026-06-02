import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import pool from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "HOUSEHOLD") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { sampahTypes, estimatedWeight, addressDetail, notes } = await req.json()

    if (!addressDetail) {
      return NextResponse.json({ error: "Alamat wajib diisi" }, { status: 400 })
    }

    const [users] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email]
    ) as any[]

    const householdId = users[0]?.id
    if (!householdId) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    }

    const requestId = uuidv4()
    await pool.execute(
      `INSERT INTO sampah_requests 
       (id, householdId, status, sampahTypes, estimatedWeight, addressDetail, notes, createdAt, updatedAt) 
       VALUES (?, ?, "OPEN", ?, ?, ?, ?, NOW(), NOW())`,
      [requestId, householdId, sampahTypes, estimatedWeight || null, addressDetail, notes || null]
    )

    return NextResponse.json({ message: "Request berhasil dibuat", requestId }, { status: 201 })
  } catch (error) {
    console.error("REQUEST ERROR:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "HOUSEHOLD") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const [users] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email]
    ) as any[]

    const userId = users[0]?.id

    const [requests] = await pool.execute(
      `SELECT * FROM sampah_requests WHERE householdId = ? ORDER BY createdAt DESC`,
      [userId]
    ) as any[]

    return NextResponse.json({ requests })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
