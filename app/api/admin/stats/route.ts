import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import pool from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const [[users], [pending], [transactions], [points]] = await Promise.all([
      pool.execute("SELECT COUNT(*) as count FROM users") as any,
      pool.execute("SELECT COUNT(*) as count FROM collector_verifications WHERE status = ?", ["PENDING"]) as any,
      pool.execute("SELECT COUNT(*) as count FROM sampah_requests") as any,
      pool.execute("SELECT COALESCE(SUM(amount), 0) as total FROM points_ledger WHERE type = ?", ["EARNED"]) as any,
    ])

    return NextResponse.json({
      users: users[0].count,
      pending: pending[0].count,
      transactions: transactions[0].count,
      totalPoints: points[0].total,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ users: 0, pending: 0, transactions: 0, totalPoints: 0 })
  }
}
