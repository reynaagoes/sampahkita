import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { v4 as uuidv4 } from "uuid"
import { getAppSession } from "@/lib/auth-session"
import fs from "node:fs"

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

    const [users] = await pool.execute("SELECT id FROM users WHERE email = ?", [session.user.email])
    const sellerId = users[0]?.id

    const formData = await req.formData()
    const title = formData.get("title")
    const description = formData.get("description")
    const contactName = String(formData.get("contactName") || "").trim()
    const contactPhone = String(formData.get("contactPhone") || "").trim()
    const minPrice = parseInt(String(formData.get("minPrice") || "0"))
    const maxPrice = parseInt(String(formData.get("maxPrice") || "0"))
    const priceStep = parseInt(String(formData.get("priceStep") || "0"))
    const images = formData.getAll("images").filter((item): item is File => item instanceof File && item.size > 0)
    const legacyPhoto = formData.get("photo")
    if (!contactName || !contactPhone) return NextResponse.json({ error: "Nama dan nomor kontak penjual wajib diisi" }, { status: 400 })
    if (!images.length && legacyPhoto instanceof File && legacyPhoto.size > 0) images.push(legacyPhoto)
    if (images.length < 1 || images.length > 5) return NextResponse.json({ error: "Upload 1 sampai 5 gambar" }, { status: 400 })

    let photoUrl = null
    const uploadedUrls: string[] = []
    for (const [index, photo] of images.entries()) {
      const bytes = await photo.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filename = uuidv4() + "-" + photo.name.replace(/[^a-zA-Z0-9.]/g, "")
      const uploadDir = "public/uploads"
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
      fs.writeFileSync(uploadDir + "/" + filename, buffer)
      const imageUrl = "/uploads/" + filename
      uploadedUrls.push(imageUrl)
      if (index === 0) photoUrl = imageUrl
    }

    const id = uuidv4()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      await connection.execute(
        "INSERT INTO bid_listings (id, sellerId, title, description, contactName, contactPhone, photoUrl, minPrice, maxPrice, currentPrice, priceStep, status, expiresAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
        [id, sellerId, title, description, contactName, contactPhone, photoUrl, minPrice, maxPrice, minPrice, priceStep, "ACTIVE", expiresAt]
      )
      for (const [index, imageUrl] of uploadedUrls.entries()) {
        await connection.execute(
          "INSERT INTO listing_images (id, listingId, imageUrl, sortOrder, createdAt) VALUES (?, ?, ?, ?, NOW())",
          [uuidv4(), id, imageUrl, index]
        )
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
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
