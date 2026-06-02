import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { v4 as uuidv4 } from "uuid"
import { getAppSession, getSessionRole } from "@/lib/auth-session"
import { allocateMaterialWeight, calculatePoints, parseWasteTypes } from "@/lib/materials"
import { awardBadgesForTotal } from "@/lib/badges"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getAppSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (getSessionRole(session.user.role) !== "COLLECTOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const [users] = await pool.execute("SELECT id, isVerified FROM users WHERE email = ?", [session.user.email]) as any[]
    const collectorId = users[0]?.id
    if (!users[0]?.isVerified) return NextResponse.json({ error: "Pengepul belum terverifikasi" }, { status: 403 })

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      const [rows] = await connection.execute(
        "SELECT * FROM sampah_requests WHERE id = ? AND collectorId = ? AND status = ? FOR UPDATE",
        [id, collectorId, "WEIGHED"]
      ) as any[]
      const request = rows[0]
      if (!request) {
        await connection.rollback()
        return NextResponse.json({ error: "Pickup tidak ditemukan atau belum memiliki berat aktual" }, { status: 409 })
      }

      const actualWeight = Number(request.actualWeight)
      if (!Number.isFinite(actualWeight) || actualWeight <= 0) {
        await connection.rollback()
        return NextResponse.json({ error: "Berat aktual tidak valid" }, { status: 400 })
      }

      const types = parseWasteTypes(request.sampahTypes)
      const totalPoints = calculatePoints(types, actualWeight)

      await connection.execute(
        "UPDATE sampah_requests SET status = ?, updatedAt = NOW() WHERE id = ?",
        ["COMPLETED", id]
      )
      await connection.execute(
        "INSERT INTO points_ledger (id, userId, amount, type, requestId, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())",
        [uuidv4(), request.householdId, totalPoints, "EARNED", id, "Sampah " + types.join(", ") + " - " + actualWeight + "kg"]
      )
      const [earnedRows] = await connection.execute(
        'SELECT COALESCE(SUM(amount), 0) AS totalEarned FROM points_ledger WHERE userId = ? AND type = "EARNED"',
        [request.householdId]
      ) as any[]
      await awardBadgesForTotal(connection, request.householdId, Number(earnedRows[0]?.totalEarned || 0))
      for (const material of allocateMaterialWeight(types, actualWeight)) {
        await connection.execute(
          `INSERT INTO collector_inventory (id, collectorId, wasteType, availableWeight, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, NOW(), NOW())
           ON DUPLICATE KEY UPDATE availableWeight = availableWeight + VALUES(availableWeight), updatedAt = NOW()`,
          [uuidv4(), collectorId, material.wasteType, material.weight]
        )
      }

      await connection.commit()
      return NextResponse.json({ message: "Request selesai", pointsEarned: totalPoints })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
