import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import pool from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user.role !== "RECYCLER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const [batches] = await pool.execute(
      "SELECT mb.*, u.fullName as collectorName FROM material_batches mb JOIN users u ON mb.collectorId = u.id WHERE mb.status = ? ORDER BY mb.createdAt DESC",
      ["AVAILABLE"]
    ) as any[]

    return NextResponse.json({ batches })
  } catch (error) {
    console.error("AVAILABLE BATCHES ERROR:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
