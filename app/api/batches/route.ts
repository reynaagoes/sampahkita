import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { v4 as uuidv4 } from "uuid"
import { getAppSession, getSessionRole } from "@/lib/auth-session"

export async function POST(req: Request) {
  try {
    const session = await getAppSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (getSessionRole(session.user.role) !== "COLLECTOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const [users] = await pool.execute("SELECT id, isVerified FROM users WHERE email = ?", [session.user.email])
    const collectorId = users[0]?.id
    if (!users[0]?.isVerified) return NextResponse.json({ error: "Pengepul belum terverifikasi" }, { status: 403 })
    const { wasteType, totalWeight, pricePerKg, grade, location, description } = await req.json()
    if (!wasteType || !Number.isFinite(Number(totalWeight)) || Number(totalWeight) <= 0 || !Number.isFinite(Number(pricePerKg)) || Number(pricePerKg) <= 0) {
      return NextResponse.json({ error: "Jenis material, berat, dan harga batch harus valid" }, { status: 400 })
    }
    const normalizedType = String(wasteType).toLowerCase()
    const id = uuidv4()
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const [result] = await connection.execute(
        "UPDATE collector_inventory SET availableWeight = availableWeight - ?, updatedAt = NOW() WHERE collectorId = ? AND wasteType = ? AND availableWeight >= ?",
        [Number(totalWeight), collectorId, normalizedType, Number(totalWeight)]
      ) as any[]
      if (!result.affectedRows) {
        await connection.rollback()
        return NextResponse.json({ error: "Stok inventori tidak cukup untuk membuat batch" }, { status: 409 })
      }
      await connection.execute(
        "INSERT INTO material_batches (id, collectorId, wasteType, totalWeight, pricePerKg, grade, location, description, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
        [id, collectorId, normalizedType, totalWeight, pricePerKg, grade || "B", location || null, description || null, "AVAILABLE"]
      )
      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
    return NextResponse.json({ message: "Batch berhasil dibuat", id }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getAppSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (getSessionRole(session.user.role) !== "COLLECTOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const [users] = await pool.execute("SELECT id, isVerified FROM users WHERE email = ?", [session.user.email])
    const collectorId = users[0]?.id
    if (!users[0]?.isVerified) return NextResponse.json({ error: "Pengepul belum terverifikasi" }, { status: 403 })
    const [batches] = await pool.execute(
      `SELECT mb.*, u.fullName AS recyclerName
       FROM material_batches mb
       LEFT JOIN users u ON mb.recyclerId = u.id
       WHERE mb.collectorId = ?
       ORDER BY mb.createdAt DESC`,
      [collectorId]
    )
    return NextResponse.json({ batches })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
