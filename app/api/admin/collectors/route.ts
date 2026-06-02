import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import pool from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const [collectors] = await pool.execute(
      `SELECT u.id, u.fullName, u.email, u.phone, cv.status
       FROM users u
       JOIN collector_verifications cv ON u.id = cv.collectorId
       WHERE cv.status = "PENDING"
       ORDER BY cv.createdAt DESC`
    ) as any[]
    return NextResponse.json({ collectors })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ collectors: [] })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const { collectorId, action } = await req.json()

    await pool.execute(
      "UPDATE collector_verifications SET status = ?, updatedAt = NOW() WHERE collectorId = ?",
      [action, collectorId]
    )

    if (action === "APPROVED") {
      await pool.execute(
        "UPDATE users SET isVerified = true WHERE id = ?",
        [collectorId]
      )
    }

    return NextResponse.json({ message: "Status updated" })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
