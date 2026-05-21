import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import pool from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [users] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email]
    ) as any[]

    const collectorId = users[0]?.id

    const [requests] = await pool.execute(
      `SELECT sr.*, u.fullName as householdName 
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
