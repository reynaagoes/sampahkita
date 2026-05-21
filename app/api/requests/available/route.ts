import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import pool from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [requests] = await pool.execute(
      "SELECT sr.*, u.fullName as householdName FROM sampah_requests sr JOIN users u ON sr.householdId = u.id WHERE sr.status = ? ORDER BY sr.createdAt DESC",
      ["OPEN"]
    ) as any[]

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("AVAILABLE ERROR:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
