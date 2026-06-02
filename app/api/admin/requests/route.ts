import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getAppSession, getSessionRole } from "@/lib/auth-session"

export async function GET() {
  try {
    const session = await getAppSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (getSessionRole(session.user.role) !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const [requests] = await pool.execute(
      `SELECT sr.*, u.fullName as householdName 
       FROM sampah_requests sr
       JOIN users u ON sr.householdId = u.id
       ORDER BY sr.createdAt DESC
       LIMIT 50`
    ) as any[]
    return NextResponse.json({ requests })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ requests: [] })
  }
}
