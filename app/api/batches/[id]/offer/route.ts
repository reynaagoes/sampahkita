import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getAppSession, getSessionRole } from "@/lib/auth-session"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getAppSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (getSessionRole(session.user.role) !== "RECYCLER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { offerPrice, recyclerContactName, recyclerContactPhone, recyclerDeliveryAddress, offerNote } = await req.json().catch(() => ({}))
    const price = Math.round(Number(offerPrice || 0))
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Harga tawar harus valid" }, { status: 400 })
    }

    const [users] = await pool.execute(
      "SELECT id, fullName, phone, address FROM users WHERE email = ?",
      [session.user.email]
    ) as any[]
    const recycler = users[0]
    const recyclerId = String(session.user.id || recycler?.id || "")
    if (!recyclerId) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })

    const [rows] = await pool.execute(
      "SELECT id, status FROM material_batches WHERE id = ?",
      [id]
    ) as any[]
    const batch = rows[0]
    if (!batch) return NextResponse.json({ error: "Batch tidak ditemukan" }, { status: 404 })
    if (String(batch.status) !== "AVAILABLE") {
      return NextResponse.json({ error: "Batch tidak tersedia untuk ditawar" }, { status: 409 })
    }

    const contactName = String(recyclerContactName || recycler.fullName || "").trim()
    const contactPhone = String(recyclerContactPhone || recycler.phone || "").trim()
    const deliveryAddress = String(recyclerDeliveryAddress || recycler.address || "").trim()
    if (!contactName || !contactPhone || !deliveryAddress) {
      return NextResponse.json({ error: "Nama kontak, nomor kontak, dan alamat pengiriman wajib diisi" }, { status: 400 })
    }

    const [result] = await pool.execute(
      `UPDATE material_batches
       SET recyclerId = ?, recyclerContactName = ?, recyclerContactPhone = ?, recyclerDeliveryAddress = ?, offerPrice = ?, offerNote = ?, status = ?, agreedPrice = NULL, counterPrice = NULL, platformFee = NULL, collectorEarning = NULL, updatedAt = NOW()
       WHERE id = ? AND status = "AVAILABLE"`,
      [recyclerId, contactName, contactPhone, deliveryAddress, price, String(offerNote || "").trim() || null, "OFFER_SUBMITTED", id]
    ) as any[]
    if (!result.affectedRows) {
      return NextResponse.json({ error: "Batch tidak tersedia untuk ditawar" }, { status: 409 })
    }

    return NextResponse.json({
      success: true,
      message: "Penawaran diajukan",
      batchId: id,
      status: "OFFER_SUBMITTED",
      offerPrice: price,
    })
  } catch (error) {
    console.error("BATCH OFFER ERROR:", error)
    const message = error instanceof Error ? error.message : "Server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
