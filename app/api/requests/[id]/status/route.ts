import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getAppSession, getSessionRole } from "@/lib/auth-session"

const TRANSITIONS: Record<string, string> = {
  ON_THE_WAY: "ASSIGNED",
  ARRIVED: "ON_THE_WAY",
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getAppSession()
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (getSessionRole(session.user.role) !== "COLLECTOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { status } = await req.json()
  const nextStatus = String(status || "").toUpperCase()
  const previousStatus = TRANSITIONS[nextStatus]
  if (!previousStatus) return NextResponse.json({ error: "Transisi status tidak valid" }, { status: 400 })

  const [users] = await pool.execute("SELECT id, isVerified FROM users WHERE email = ?", [session.user.email]) as any[]
  if (!users[0]?.isVerified) return NextResponse.json({ error: "Pengepul belum terverifikasi" }, { status: 403 })

  const [result] = await pool.execute(
    "UPDATE sampah_requests SET status = ?, updatedAt = NOW() WHERE id = ? AND collectorId = ? AND status = ?",
    [nextStatus, id, users[0].id, previousStatus]
  ) as any[]
  if (!result.affectedRows) return NextResponse.json({ error: "Status pickup tidak dapat diperbarui" }, { status: 409 })

  return NextResponse.json({ message: "Status pickup diperbarui", status: nextStatus })
}
