import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import pool from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  try {
    const [listings] = await pool.execute(
      `SELECT bl.*, u.fullName as sellerName,
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

export async function POST(req) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const [users] = await pool.execute("SELECT id FROM users WHERE email = ?", [session.user.email])
    const sellerId = users[0]?.id

    const formData = await req.formData()
    const title = formData.get("title")
    const description = formData.get("description")
    const minPrice = parseInt(formData.get("minPrice"))
    const maxPrice = parseInt(formData.get("maxPrice"))
    const priceStep = parseInt(formData.get("priceStep"))
    const photo = formData.get("photo")

    let photoUrl = null
    if (photo && photo.size > 0) {
      const bytes = await photo.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filename = uuidv4() + "-" + photo.name.replace(/[^a-zA-Z0-9.]/g, "")
      const uploadDir = "public/uploads"
      const fs2 = require("fs")
      if (!fs2.existsSync(uploadDir)) fs2.mkdirSync(uploadDir, { recursive: true })
      fs2.writeFileSync(uploadDir + "/" + filename, buffer)
      photoUrl = "/uploads/" + filename
    }

    const id = uuidv4()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await pool.execute(
      "INSERT INTO bid_listings (id, sellerId, title, description, photoUrl, minPrice, maxPrice, currentPrice, priceStep, status, expiresAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [id, sellerId, title, description, photoUrl, minPrice, maxPrice, minPrice, priceStep, "ACTIVE", expiresAt]
    )

    return NextResponse.json({ message: "Listing berhasil dibuat", id }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}