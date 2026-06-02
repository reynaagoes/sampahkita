import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getAppSession, getSessionRole } from "@/lib/auth-session"

export async function GET() {
  const session = await getAppSession()
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (getSessionRole(session.user.role) !== "COLLECTOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const [users] = await pool.execute("SELECT id, isVerified FROM users WHERE email = ?", [session.user.email]) as any[]
  if (!users[0]?.isVerified) return NextResponse.json({ error: "Pengepul belum terverifikasi" }, { status: 403 })

  const [batches] = await pool.execute(
    `SELECT mb.*, u.fullName AS recyclerName, u.phone AS recyclerPhone
     FROM material_batches mb
     LEFT JOIN users u ON mb.recyclerId = u.id
     WHERE mb.collectorId = ? AND mb.status <> "AVAILABLE"
     ORDER BY mb.updatedAt DESC`,
    [users[0].id]
  )
  return NextResponse.json({ batches })
}
