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
    const recyclerId = users[0]?.id || session.user.id
    if (!recyclerId) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })

    const [rows] = await pool.execute(
      "SELECT id, recyclerId, status FROM material_batches WHERE id = ?",
      [id]
    ) as any[]
    const batch = rows[0]
    if (!batch) return NextResponse.json({ error: "Batch tidak ditemukan" }, { status: 404 })
    if (String(batch.recyclerId) !== String(recyclerId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    if (String(batch.status) !== "DELIVERED") {
      return NextResponse.json({ error: "Material belum diserahkan" }, { status: 409 })
    }

    const [result] = await pool.execute(
      'UPDATE material_batches SET status = "COMPLETED", completedAt = NOW(), updatedAt = NOW() WHERE id = ? AND recyclerId = ? AND status = "DELIVERED"',
      [id, recyclerId]
    ) as any[]
    if (!result.affectedRows) return NextResponse.json({ error: "Material belum diserahkan atau batch tidak ditemukan" }, { status: 409 })
    return NextResponse.json({ success: true, message: "Penerimaan material dikonfirmasi", status: "COMPLETED" })
  } catch (error) {
    console.error("BATCH CONFIRM ERROR:", error)
    const message = error instanceof Error ? error.message : "Server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
