import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import pool from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

const POINTS: Record<string, number> = {
  plastik: 500, kertas: 300, logam: 800, kaca: 400, elektronik: 1000
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { actualWeight } = await req.json()

    const [rows] = await pool.execute(
      "SELECT * FROM sampah_requests WHERE id = ?",
      [id]
    ) as any[]
    const request = rows[0]
    if (!request) return NextResponse.json({ error: "Request tidak ditemukan" }, { status: 404 })

    await pool.execute(
      "UPDATE sampah_requests SET status = ?, actualWeight = ?, updatedAt = NOW() WHERE id = ?",
      ["COMPLETED", actualWeight, id]
    )

    const types = JSON.parse(request.sampahTypes || "[]")
    const basePoints = types.reduce((sum: number, t: string) => sum + (POINTS[t] || 300), 0)
    const totalPoints = Math.round(basePoints * actualWeight)

    await pool.execute(
      "INSERT INTO points_ledger (id, userId, amount, type, requestId, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())",
      [uuidv4(), request.householdId, totalPoints, "EARNED", id, "Sampah " + types.join(", ") + " - " + actualWeight + "kg"]
    )

    return NextResponse.json({ message: "Request selesai", pointsEarned: totalPoints })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
