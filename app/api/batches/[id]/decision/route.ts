import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getAppSession, getSessionRole } from "@/lib/auth-session"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getAppSession()
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (getSessionRole(session.user.role) !== "COLLECTOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { action } = await req.json()
  const nextStatus = action === "APPROVE" ? "APPROVED" : action === "REJECT" ? "REJECTED" : ""
  if (!nextStatus) return NextResponse.json({ error: "Keputusan tidak valid" }, { status: 400 })

  const [users] = await pool.execute("SELECT id, isVerified FROM users WHERE email = ?", [session.user.email]) as any[]
  if (!users[0]?.isVerified) return NextResponse.json({ error: "Pengepul belum terverifikasi" }, { status: 403 })
  const [result] = await pool.execute(
    "UPDATE material_batches SET status = ?, updatedAt = NOW() WHERE id = ? AND collectorId = ? AND status = ?",
    [nextStatus, id, users[0].id, "PURCHASE_REQUESTED"]
  ) as any[]
  if (!result.affectedRows) return NextResponse.json({ error: "Pengajuan pembelian tidak ditemukan" }, { status: 409 })
  return NextResponse.json({ message: nextStatus === "APPROVED" ? "Pembelian disetujui" : "Pembelian ditolak" })
}
