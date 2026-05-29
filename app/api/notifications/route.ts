import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import pool from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const [users] = await pool.execute("SELECT id FROM users WHERE email = ?", [session.user.email])
    const userId = users[0]?.id
    const [notifications] = await pool.execute(
      "SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 20",
      [userId]
    )
    return NextResponse.json({ notifications })
  } catch (error) {
    return NextResponse.json({ notifications: [] })
  }
}

export async function PATCH() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const [users] = await pool.execute("SELECT id FROM users WHERE email = ?", [session.user.email])
    const userId = users[0]?.id
    await pool.execute("UPDATE notifications SET isRead = true WHERE userId = ?", [userId])
    return NextResponse.json({ message: "All read" })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}