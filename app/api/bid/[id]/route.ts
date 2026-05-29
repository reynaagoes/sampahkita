import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import pool from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

export async function POST(req, { params }) {
  try {
    const { id } = await params
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const [users] = await pool.execute("SELECT id, fullName FROM users WHERE email = ?", [session.user.email])
    const bidderId = users[0]?.id
    const bidderName = users[0]?.fullName

    const [listings] = await pool.execute("SELECT * FROM bid_listings WHERE id = ?", [id])
    const listing = listings[0]
    if (!listing) return NextResponse.json({ error: "Listing tidak ditemukan" }, { status: 404 })
    if (listing.status !== "ACTIVE") return NextResponse.json({ error: "Listing sudah tidak aktif" }, { status: 400 })
    if (listing.sellerId === bidderId) return NextResponse.json({ error: "Tidak bisa bid barang sendiri" }, { status: 400 })

    const nextPrice = listing.currentPrice + listing.priceStep
    if (nextPrice > listing.maxPrice) return NextResponse.json({ error: "Harga sudah mencapai maksimum" }, { status: 400 })

    await pool.execute(
      "INSERT INTO bids (id, listingId, bidderId, amount, createdAt) VALUES (?, ?, ?, ?, NOW())",
      [uuidv4(), id, bidderId, nextPrice]
    )

    await pool.execute(
      "UPDATE bid_listings SET currentPrice = ?, updatedAt = NOW() WHERE id = ?",
      [nextPrice, id]
    )

    // Auto close if max price reached
    if (nextPrice >= listing.maxPrice) {
      await pool.execute(
        "UPDATE bid_listings SET status = ?, winnerId = ?, updatedAt = NOW() WHERE id = ?",
        ["SOLD", bidderId, id]
      )
    }

    // Add notification to seller
    await pool.execute(
      "INSERT INTO notifications (id, userId, title, message, type, referenceId, isRead, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
      [uuidv4(), listing.sellerId, "Ada Bid Baru!", bidderName + " menawar " + listing.title + " seharga Rp " + nextPrice.toLocaleString("id-ID"), "BID", id, false]
    )

    return NextResponse.json({ message: "Bid berhasil", newPrice: nextPrice })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function GET(req, { params }) {
  try {
    const { id } = await params
    const [listing] = await pool.execute(
      `SELECT bl.*, u.fullName as sellerName,
        (SELECT COUNT(*) FROM bids b WHERE b.listingId = bl.id) as bidCount
       FROM bid_listings bl JOIN users u ON bl.sellerId = u.id WHERE bl.id = ?`,
      [id]
    )
    const [bidHistory] = await pool.execute(
      "SELECT b.*, u.fullName as bidderName FROM bids b JOIN users u ON b.bidderId = u.id WHERE b.listingId = ? ORDER BY b.createdAt DESC",
      [id]
    )
    return NextResponse.json({ listing: listing[0], bidHistory })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}