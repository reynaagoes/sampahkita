import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getAppSession, getSessionRole } from "@/lib/auth-session"
import { getBatchFinance } from "@/lib/batch-status"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getAppSession()
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (getSessionRole(session.user.role) !== "COLLECTOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const action = String(body.action || body.decision || "").toUpperCase()
  const nextStatus = action === "APPROVE" ? "APPROVED" : action === "REJECT" ? "REJECTED" : ""
  if (!nextStatus) return NextResponse.json({ error: "Keputusan tidak valid" }, { status: 400 })

  const [users] = await pool.execute("SELECT id, isVerified FROM users WHERE email = ?", [session.user.email]) as any[]
  if (!users[0]?.isVerified) return NextResponse.json({ error: "Pengepul belum terverifikasi" }, { status: 403 })

  const [rows] = await pool.execute(
    "SELECT id, status, offerPrice FROM material_batches WHERE id = ? AND collectorId = ?",
    [id, users[0].id]
  ) as any[]
  const batch = rows[0]
  if (!batch || !["OFFER_SUBMITTED", "PURCHASE_REQUESTED"].includes(String(batch.status))) {
    return NextResponse.json({ error: "Pengajuan pembelian tidak ditemukan" }, { status: 409 })
  }

  if (nextStatus === "REJECTED") {
    const [result] = await pool.execute(
      'UPDATE material_batches SET status = "REJECTED", updatedAt = NOW() WHERE id = ? AND collectorId = ? AND status IN ("OFFER_SUBMITTED", "PURCHASE_REQUESTED")',
      [id, users[0].id]
    ) as any[]
    if (!result.affectedRows) return NextResponse.json({ error: "Pengajuan pembelian tidak ditemukan" }, { status: 409 })
    return NextResponse.json({ message: "Pembelian ditolak", status: "REJECTED" })
  }

  const finance = getBatchFinance(batch.offerPrice)
  const [result] = await pool.execute(
    `UPDATE material_batches
     SET status = "APPROVED", agreedPrice = ?, platformFee = ?, collectorEarning = ?, updatedAt = NOW()
     WHERE id = ? AND collectorId = ? AND status IN ("OFFER_SUBMITTED", "PURCHASE_REQUESTED")`,
    [finance.agreedPrice, finance.platformFee, finance.collectorEarning, id, users[0].id]
  ) as any[]
  if (!result.affectedRows) return NextResponse.json({ error: "Pengajuan pembelian tidak ditemukan" }, { status: 409 })
  return NextResponse.json({ message: "Pembelian disetujui", status: "APPROVED", ...finance })
}
