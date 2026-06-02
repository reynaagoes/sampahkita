import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getAppSession, getSessionRole } from "@/lib/auth-session"

export async function GET() {
  const session = await getAppSession()
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (getSessionRole(session.user.role) !== "COLLECTOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const [users] = await pool.execute("SELECT id, isVerified FROM users WHERE email = ?", [session.user.email]) as any[]
  if (!users[0]?.isVerified) return NextResponse.json({ error: "Pengepul belum terverifikasi" }, { status: 403 })

  const [inventory] = await pool.execute(
    "SELECT id, wasteType, availableWeight, updatedAt FROM collector_inventory WHERE collectorId = ? ORDER BY wasteType",
    [users[0].id]
  )
  return NextResponse.json({ inventory })
}
