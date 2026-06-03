import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getAppSession, getSessionRole } from "@/lib/auth-session"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getAppSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (getSessionRole(session.user.role) !== "COLLECTOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { counterPrice, counterNote } = await req.json()
    const price = Math.round(Number(counterPrice || 0))
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Harga balik harus valid" }, { status: 400 })
    }

    const [users] = await pool.execute("SELECT id, isVerified FROM users WHERE email = ?", [session.user.email]) as any[]
    if (!users[0]?.isVerified) return NextResponse.json({ error: "Pengepul belum terverifikasi" }, { status: 403 })

    const [result] = await pool.execute(
      `UPDATE material_batches
       SET counterPrice = ?, counterNote = ?, status = ?, updatedAt = NOW()
       WHERE id = ? AND collectorId = ? AND status IN ("OFFER_SUBMITTED", "COUNTER_OFFERED")`,
      [price, counterNote || null, "COUNTER_OFFERED", id, users[0].id]
    ) as any[]

    if (!result.affectedRows) return NextResponse.json({ error: "Penawaran tidak ditemukan" }, { status: 409 })
    return NextResponse.json({ message: "Harga balik dikirim", status: "COUNTER_OFFERED", counterPrice: price })
  } catch (error) {
    console.error("BATCH COUNTER ERROR:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
