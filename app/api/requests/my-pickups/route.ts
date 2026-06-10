import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getAppSession, getSessionRole } from "@/lib/auth-session"

export async function GET() {
  try {
    const session = await getAppSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (getSessionRole(session.user.role) !== "COLLECTOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const [users] = await pool.execute(
      "SELECT id, isVerified FROM users WHERE email = ?",
      [session.user.email]
    ) as any[]

    const collectorId = users[0]?.id
    if (!users[0]?.isVerified) return NextResponse.json({ error: "Pengepul belum terverifikasi" }, { status: 403 })

    const [requests] = await pool.execute(
      `SELECT sr.*, u.fullName as householdName, u.phone as householdPhone,
        COALESCE(NULLIF(TRIM(sr.contactPhone), ''), u.phone) as pickupContactPhone
       FROM sampah_requests sr
       JOIN users u ON sr.householdId = u.id
       WHERE sr.collectorId = ?
       ORDER BY sr.updatedAt DESC`,
      [collectorId]
    ) as any[]

    return NextResponse.json({ requests })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
