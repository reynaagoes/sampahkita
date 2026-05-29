const fs = require('fs');
fs.mkdirSync('app/api/batches', { recursive: true });
fs.mkdirSync('app/api/batches/available', { recursive: true });
fs.mkdirSync('app/api/batches/my-purchases', { recursive: true });

const route = `import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import pool from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

export async function POST(req) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const [users] = await pool.execute("SELECT id FROM users WHERE email = ?", [session.user.email])
    const collectorId = users[0]?.id
    const { wasteType, totalWeight, pricePerKg, location, description } = await req.json()
    const id = uuidv4()
    await pool.execute(
      "INSERT INTO material_batches (id, collectorId, wasteType, totalWeight, pricePerKg, location, description, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [id, collectorId, wasteType, totalWeight, pricePerKg, location || null, description || null, "AVAILABLE"]
    )
    return NextResponse.json({ message: "Batch berhasil dibuat", id }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const [users] = await pool.execute("SELECT id FROM users WHERE email = ?", [session.user.email])
    const collectorId = users[0]?.id
    const [batches] = await pool.execute(
      "SELECT * FROM material_batches WHERE collectorId = ? ORDER BY createdAt DESC",
      [collectorId]
    )
    return NextResponse.json({ batches })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}`;

const available = `import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import pool from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const [batches] = await pool.execute(
      "SELECT mb.*, u.fullName as collectorName FROM material_batches mb JOIN users u ON mb.collectorId = u.id WHERE mb.status = ? ORDER BY mb.createdAt DESC",
      ["AVAILABLE"]
    )
    return NextResponse.json({ batches })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}`;

const myPurchases = `import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import pool from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const [users] = await pool.execute("SELECT id FROM users WHERE email = ?", [session.user.email])
    const recyclerId = users[0]?.id
    const [batches] = await pool.execute(
      "SELECT mb.*, u.fullName as collectorName FROM material_batches mb JOIN users u ON mb.collectorId = u.id WHERE mb.recyclerId = ? ORDER BY mb.updatedAt DESC",
      [recyclerId]
    )
    return NextResponse.json({ batches })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}`;

fs.mkdirSync('app/api/batches/[id]/purchase', { recursive: true });

const purchase = `import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import pool from "@/lib/db"

export async function POST(req, { params }) {
  try {
    const { id } = await params
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const [users] = await pool.execute("SELECT id FROM users WHERE email = ?", [session.user.email])
    const recyclerId = users[0]?.id
    await pool.execute(
      "UPDATE material_batches SET recyclerId = ?, status = ?, updatedAt = NOW() WHERE id = ? AND status = ?",
      [recyclerId, "SOLD", id, "AVAILABLE"]
    )
    return NextResponse.json({ message: "Pembelian berhasil" })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}`;

fs.writeFileSync('app/api/batches/route.ts', route, {encoding:'utf8'});
fs.writeFileSync('app/api/batches/available/route.ts', available, {encoding:'utf8'});
fs.writeFileSync('app/api/batches/my-purchases/route.ts', myPurchases, {encoding:'utf8'});
fs.writeFileSync('app/api/batches/[id]/purchase/route.ts', purchase, {encoding:'utf8'});
console.log('Batches API OK');
