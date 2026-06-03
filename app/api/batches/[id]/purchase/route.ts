import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getAppSession, getSessionRole } from "@/lib/auth-session"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getAppSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (getSessionRole(session.user.role) !== "RECYCLER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const payload = await req.json().catch(() => ({}))
    const [users] = await pool.execute(
      "SELECT id, fullName, phone, address FROM users WHERE email = ?",
      [session.user.email]
    ) as any[]
    const recycler = users[0]
    if (!recycler) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })

    const [batches] = await pool.execute(
      "SELECT id, status, pricePerKg, totalWeight FROM material_batches WHERE id = ?",
      [id]
    ) as any[]
    const batch = batches[0]
    if (!batch || String(batch.status) !== "AVAILABLE") {
      return NextResponse.json({ error: "Batch sudah dibeli atau tidak tersedia" }, { status: 409 })
    }

    const offerPrice = Math.round(Number(payload.offerPrice || Number(batch.pricePerKg) * Number(batch.totalWeight) || 0))
    const recyclerContactName = String(payload.recyclerContactName || recycler.fullName || "").trim()
    const recyclerContactPhone = String(payload.recyclerContactPhone || recycler.phone || "").trim()
    const recyclerDeliveryAddress = String(payload.recyclerDeliveryAddress || recycler.address || "").trim()
    const offerNote = String(payload.offerNote || "").trim() || null
    if (!offerPrice || !recyclerContactName || !recyclerContactPhone || !recyclerDeliveryAddress) {
      return NextResponse.json({ error: "Data penawaran belum lengkap" }, { status: 400 })
    }

    await pool.execute(
      `UPDATE material_batches
       SET recyclerId = ?, recyclerContactName = ?, recyclerContactPhone = ?, recyclerDeliveryAddress = ?, offerPrice = ?, offerNote = ?, status = "OFFER_SUBMITTED", updatedAt = NOW()
       WHERE id = ? AND status = "AVAILABLE"`,
      [recycler.id, recyclerContactName, recyclerContactPhone, recyclerDeliveryAddress, offerPrice, offerNote, id]
    )

    return NextResponse.json({ message: "Penawaran dikirim", status: "OFFER_SUBMITTED" })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
