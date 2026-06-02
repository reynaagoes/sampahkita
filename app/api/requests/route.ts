import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { v4 as uuidv4 } from "uuid"
import { getAppSession, getSessionRole } from "@/lib/auth-session"

export async function POST(req: Request) {
  try {
    const session = await getAppSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const role = getSessionRole(session.user.role)
    if (role !== "HOUSEHOLD") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { sampahTypes, estimatedWeight, addressDetail, contactPhone, notes } = await req.json()

    if (!addressDetail || !contactPhone) {
      return NextResponse.json({ error: "Alamat dan nomor kontak wajib diisi" }, { status: 400 })
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
       (id, householdId, status, sampahTypes, estimatedWeight, addressDetail, contactPhone, notes, createdAt, updatedAt) 
       VALUES (?, ?, "OPEN", ?, ?, ?, ?, ?, NOW(), NOW())`,
      [requestId, householdId, sampahTypes, estimatedWeight || null, addressDetail, contactPhone, notes || null]
    )

    return NextResponse.json({ message: "Request berhasil dibuat", requestId }, { status: 201 })
  } catch (error) {
    console.error("REQUEST ERROR:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getAppSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const role = getSessionRole(session.user.role)
    if (role !== "HOUSEHOLD") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const [users] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email]
    ) as any[]

    const userId = users[0]?.id

    const [requests] = await pool.execute(
      `SELECT sr.*, u.fullName AS collectorName, u.phone AS collectorPhone,
        COALESCE((
          SELECT SUM(pl.amount)
          FROM points_ledger pl
          WHERE pl.requestId = sr.id AND pl.type = "EARNED"
        ), 0) AS pointsAwarded
       FROM sampah_requests sr
       LEFT JOIN users u ON sr.collectorId = u.id
       WHERE sr.householdId = ?
       ORDER BY sr.createdAt DESC`,
      [userId]
    ) as any[]

    const shapedRequests = requests.map((request: any) => ({
      ...request,
      collector: request.collectorId
        ? {
          id: request.collectorId,
          fullName: request.collectorName || null,
          phone: request.collectorPhone || null,
        }
        : null,
    }))

    return NextResponse.json({ requests: shapedRequests })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
