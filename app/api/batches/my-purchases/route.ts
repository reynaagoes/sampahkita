import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getAppSession, getSessionRole } from "@/lib/auth-session"

export async function GET() {
  try {
    const session = await getAppSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (getSessionRole(session.user.role) !== "RECYCLER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const [users] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email]
    ) as any[]
    const recyclerId = users[0]?.id

    const [batches] = await pool.execute(
      "SELECT mb.*, u.fullName as collectorName, u.phone as collectorPhone FROM material_batches mb JOIN users u ON mb.collectorId = u.id WHERE mb.recyclerId = ? ORDER BY mb.updatedAt DESC",
      [recyclerId]
    ) as any[]

    return NextResponse.json({ batches })
  } catch (error) {
    console.error("MY PURCHASES ERROR:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
