import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getAppSession, getSessionRole } from "@/lib/auth-session"

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getAppSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (getSessionRole(session.user.role) !== "RECYCLER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const [users] = await pool.execute("SELECT id FROM users WHERE email = ?", [session.user.email]) as any[]
    const recyclerId = users[0]?.id
    const [result] = await pool.execute(
      `UPDATE material_batches
       SET status = "CANCELLED", updatedAt = NOW()
       WHERE id = ? AND recyclerId = ? AND status IN ("OFFER_SUBMITTED", "COUNTER_OFFERED")`,
      [id, recyclerId]
    ) as any[]
    if (!result.affectedRows) return NextResponse.json({ error: "Penawaran tidak dapat dibatalkan" }, { status: 409 })
    return NextResponse.json({ message: "Penawaran dibatalkan", status: "CANCELLED" })
  } catch (error) {
    console.error("CANCEL OFFER ERROR:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
