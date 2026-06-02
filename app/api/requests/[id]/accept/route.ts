import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getAppSession, getSessionRole } from "@/lib/auth-session"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getAppSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (getSessionRole(session.user.role) !== "COLLECTOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const [users] = await pool.execute(
      "SELECT id, isVerified FROM users WHERE email = ?",
      [session.user.email]
    ) as any[]
    const collectorId = users[0]?.id
    if (!users[0]?.isVerified) return NextResponse.json({ error: "Pengepul belum terverifikasi" }, { status: 403 })

    const [result] = await pool.execute(
      "UPDATE sampah_requests SET collectorId = ?, status = ?, updatedAt = NOW() WHERE id = ? AND status = ?",
      [collectorId, "ASSIGNED", id, "OPEN"]
    ) as any[]
    if (!result.affectedRows) return NextResponse.json({ error: "Request sudah diambil atau tidak tersedia" }, { status: 409 })

    return NextResponse.json({ message: "Request diterima" })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
