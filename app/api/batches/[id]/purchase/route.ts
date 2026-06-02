import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getAppSession, getSessionRole } from "@/lib/auth-session"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getAppSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (getSessionRole(session.user.role) !== "RECYCLER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const [users] = await pool.execute("SELECT id FROM users WHERE email = ?", [session.user.email])
    const recyclerId = users[0]?.id
    const [result] = await pool.execute(
      "UPDATE material_batches SET recyclerId = ?, status = ?, updatedAt = NOW() WHERE id = ? AND status = ?",
      [recyclerId, "PURCHASE_REQUESTED", id, "AVAILABLE"]
    ) as any[]
    if (!result.affectedRows) return NextResponse.json({ error: "Batch sudah dibeli atau tidak tersedia" }, { status: 409 })
    return NextResponse.json({ message: "Pengajuan pembelian dikirim" })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
