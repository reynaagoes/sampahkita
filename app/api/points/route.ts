import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import pool from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "HOUSEHOLD") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const [users] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email]
    ) as any[]

    const userId = users[0]?.id

    const [rows] = await pool.execute(
      "SELECT COALESCE(SUM(amount), 0) as total FROM points_ledger WHERE userId = ?",
      [userId]
    ) as any[]

    return NextResponse.json({ total: rows[0]?.total || 0 })
  } catch (error) {
    return NextResponse.json({ total: 0 })
  }
}
