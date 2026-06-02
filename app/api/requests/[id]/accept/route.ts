import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import pool from "@/lib/db"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "COLLECTOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const [users] = await pool.execute(
      "SELECT id, isVerified FROM users WHERE email = ?",
      [session.user.email]
    ) as any[]
    const collectorId = users[0]?.id
    if (!users[0]?.isVerified) return NextResponse.json({ error: "Pengepul belum terverifikasi" }, { status: 403 })

    await pool.execute(
      "UPDATE sampah_requests SET collectorId = ?, status = ?, updatedAt = NOW() WHERE id = ? AND status = ?",
      [collectorId, "ASSIGNED", id, "OPEN"]
    )

    return NextResponse.json({ message: "Request diterima" })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
