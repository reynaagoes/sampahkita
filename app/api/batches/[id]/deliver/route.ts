import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getAppSession, getSessionRole } from "@/lib/auth-session"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getAppSession()
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (getSessionRole(session.user.role) !== "COLLECTOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const [users] = await pool.execute("SELECT id FROM users WHERE email = ?", [session.user.email]) as any[]
  const body = await req.json().catch(() => ({}))
  const [result] = await pool.execute(
    `UPDATE material_batches
     SET status = "DELIVERED", deliveredAt = NOW(), deliveryNote = ?, updatedAt = NOW()
     WHERE id = ? AND collectorId = ? AND status = "IN_DELIVERY"`,
    [String(body.deliveryNote || "").trim() || null, id, users[0]?.id]
  ) as any[]
  if (!result.affectedRows) return NextResponse.json({ error: "Batch belum dalam pengiriman atau tidak ditemukan" }, { status: 409 })
  return NextResponse.json({ message: "Material ditandai sudah diserahkan" })
}
