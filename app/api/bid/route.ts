import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { v4 as uuidv4 } from "uuid"
import { getAppSession } from "@/lib/auth-session"

export async function GET() {
  try {
    const [listings] = await pool.execute(
      `SELECT bl.*, u.fullName as sellerName,
        COALESCE((SELECT li.imageUrl FROM listing_images li WHERE li.listingId = bl.id ORDER BY li.sortOrder ASC LIMIT 1), bl.photoUrl) as photoUrl,
        (SELECT COUNT(*) FROM bids b WHERE b.listingId = bl.id) as bidCount,
        (SELECT MAX(b.amount) FROM bids b WHERE b.listingId = bl.id) as highestBid
       FROM bid_listings bl
       JOIN users u ON bl.sellerId = u.id
       WHERE bl.status = "ACTIVE" AND bl.expiresAt > NOW()
       ORDER BY bl.createdAt DESC`
    )
    return NextResponse.json({ listings })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAppSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const [users] = await pool.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [session.user.email]) as any[]
    const sellerId = users[0]?.id
    if (!sellerId) return NextResponse.json({ error: "User penjual tidak ditemukan" }, { status: 400 })

    const body = await req.json()
    const title = String(body.title || "").trim()
    const description = String(body.description || "").trim() || null
    const contactName = String(body.contactName || "").trim()
    const contactPhone = String(body.contactPhone || "").trim()
    const minPrice = parseInt(String(body.minPrice || "0"), 10)
    const maxPrice = parseInt(String(body.maxPrice || "0"), 10)
    const priceStep = parseInt(String(body.priceStep || "0"), 10)
    const incomingImages: unknown[] = Array.isArray(body.images) ? body.images : []

    if (!title) return NextResponse.json({ error: "Nama barang wajib diisi" }, { status: 400 })
    if (!contactName || !contactPhone) return NextResponse.json({ error: "Nama dan nomor kontak penjual wajib diisi" }, { status: 400 })
    if (!Number.isFinite(minPrice) || minPrice <= 0) return NextResponse.json({ error: "Harga minimum tidak valid" }, { status: 400 })
    if (!Number.isFinite(maxPrice) || maxPrice <= minPrice) return NextResponse.json({ error: "Harga maksimum harus lebih besar dari minimum" }, { status: 400 })
    if (!Number.isFinite(priceStep) || priceStep <= 0) return NextResponse.json({ error: "Kelipatan bid tidak valid" }, { status: 400 })
    if (incomingImages.length > 5) return NextResponse.json({ error: "Maksimal 5 gambar" }, { status: 400 })

    const normalizedImages = incomingImages
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item): item is string => Boolean(item))
      .slice(0, 5)

    const photoUrl = normalizedImages[0] || null

    const id = uuidv4()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      await connection.execute(
        "INSERT INTO bid_listings (id, sellerId, title, description, contactName, contactPhone, photoUrl, minPrice, maxPrice, currentPrice, priceStep, status, expiresAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
        [id, sellerId, title, description, contactName, contactPhone, photoUrl, minPrice, maxPrice, minPrice, priceStep, "ACTIVE", expiresAt]
      )
      for (const [index, imageUrl] of normalizedImages.entries()) {
        try {
          await connection.execute(
            "INSERT INTO listing_images (id, listingId, imageUrl, sortOrder, createdAt) VALUES (?, ?, ?, ?, NOW())",
            [uuidv4(), id, imageUrl, index]
          )
        } catch (imageError) {
          console.error("BID_IMAGE_INSERT_ERROR", imageError)
        }
      }
      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }

    return NextResponse.json({ message: "Listing berhasil dibuat", id }, { status: 201 })
  } catch (error) {
    console.error("BID_CREATE_ERROR", error)
    return NextResponse.json({ error: "Terjadi kesalahan saat membuat listing bid" }, { status: 500 })
  }
}
