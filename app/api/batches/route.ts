import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import pool from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const [users] = await pool.execute("SELECT id FROM users WHERE email = ?", [session.user.email])
    const collectorId = users[0]?.id
    const { wasteType, totalWeight, pricePerKg, location, description } = await req.json()
    const id = uuidv4()
    await pool.execute(
      "INSERT INTO material_batches (id, collectorId, wasteType, totalWeight, pricePerKg, location, description, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [id, collectorId, wasteType, totalWeight, pricePerKg, location || null, description || null, "AVAILABLE"]
    )
    return NextResponse.json({ message: "Batch berhasil dibuat", id }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const [users] = await pool.execute("SELECT id FROM users WHERE email = ?", [session.user.email])
    const collectorId = users[0]?.id
    const [batches] = await pool.execute(
      "SELECT * FROM material_batches WHERE collectorId = ? ORDER BY createdAt DESC",
      [collectorId]
    )
    return NextResponse.json({ batches })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
