import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getAppSession, getSessionRole } from "@/lib/auth-session"
import { getBatchFinance } from "@/lib/batch-status"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getAppSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (getSessionRole(session.user.role) !== "RECYCLER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { offerPrice, recyclerContactName, recyclerContactPhone, recyclerDeliveryAddress, offerNote } = await req.json()
    const price = Math.round(Number(offerPrice || 0))
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Harga tawar harus valid" }, { status: 400 })
    }

    const [users] = await pool.execute(
      "SELECT id, fullName, phone, address FROM users WHERE email = ?",
      [session.user.email]
    ) as any[]
    const recycler = users[0]
    if (!recycler?.id) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })

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

    const finance = getBatchFinance(price)
    await pool.execute(
      `UPDATE material_batches
       SET recyclerId = ?, recyclerContactName = ?, recyclerContactPhone = ?, recyclerDeliveryAddress = ?, offerPrice = ?, offerNote = ?, status = ?, agreedPrice = NULL, counterPrice = NULL, platformFee = NULL, collectorEarning = NULL, updatedAt = NOW()
       WHERE id = ? AND status = "AVAILABLE"`,
      [recycler.id, contactName, contactPhone, deliveryAddress, price, offerNote || null, "OFFER_SUBMITTED", id]
    )

    return NextResponse.json({
      message: "Penawaran diajukan",
      batchId: id,
      status: "OFFER_SUBMITTED",
      offerPrice: finance.agreedPrice,
    })
  } catch (error) {
    console.error("BATCH OFFER ERROR:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
