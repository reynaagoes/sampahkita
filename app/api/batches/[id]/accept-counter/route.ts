import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getAppSession, getSessionRole } from "@/lib/auth-session"
import { getBatchFinance } from "@/lib/batch-status"

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getAppSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (getSessionRole(session.user.role) !== "RECYCLER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const [users] = await pool.execute("SELECT id FROM users WHERE email = ?", [session.user.email]) as any[]
    const recyclerId = users[0]?.id

    const [batches] = await pool.execute(
      "SELECT id, recyclerId, status, counterPrice FROM material_batches WHERE id = ?",
      [id]
    ) as any[]
    const batch = batches[0]
    if (!batch || batch.recyclerId !== recyclerId) {
      return NextResponse.json({ error: "Penawaran tidak ditemukan" }, { status: 404 })
    }
    if (String(batch.status) !== "COUNTER_OFFERED") {
      return NextResponse.json({ error: "Counter offer belum tersedia" }, { status: 409 })
    }

    const finance = getBatchFinance(batch.counterPrice)
    const [result] = await pool.execute(
      `UPDATE material_batches
       SET status = "APPROVED", agreedPrice = ?, platformFee = ?, collectorEarning = ?, updatedAt = NOW()
       WHERE id = ? AND recyclerId = ? AND status = "COUNTER_OFFERED"`,
      [finance.agreedPrice, finance.platformFee, finance.collectorEarning, id, recyclerId]
    ) as any[]

    if (!result.affectedRows) return NextResponse.json({ error: "Counter offer tidak dapat diterima" }, { status: 409 })
    return NextResponse.json({ message: "Harga collector diterima", status: "APPROVED", ...finance })
  } catch (error) {
    console.error("ACCEPT COUNTER ERROR:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
