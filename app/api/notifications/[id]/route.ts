import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getAppSession } from "@/lib/auth-session"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getAppSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const [users] = await pool.execute("SELECT id FROM users WHERE email = ?", [session.user.email]) as any[]
    await pool.execute("UPDATE notifications SET isRead = true WHERE id = ? AND userId = ?", [id, users[0]?.id])
    return NextResponse.json({ message: "Marked as read" })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
