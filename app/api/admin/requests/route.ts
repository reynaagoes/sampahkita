import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import pool from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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
