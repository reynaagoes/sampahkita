const mysql = require("mysql2/promise")
const bcrypt = require("bcryptjs")

const ids = {
  household1: "10000000-0000-4000-8000-000000000001",
  household2: "10000000-0000-4000-8000-000000000002",
  household3: "10000000-0000-4000-8000-000000000003",
  household4: "10000000-0000-4000-8000-000000000004",
  collector1: "20000000-0000-4000-8000-000000000001",
  collector2: "20000000-0000-4000-8000-000000000002",
  recycler: "30000000-0000-4000-8000-000000000001",
  request: "40000000-0000-4000-8000-000000000001",
  ledger: "50000000-0000-4000-8000-000000000001",
  redeemLedger: "50000000-0000-4000-8000-000000000002",
  reward1: "51000000-0000-4000-8000-000000000001",
  badge1: "52000000-0000-4000-8000-000000000001",
  badge2: "52000000-0000-4000-8000-000000000002",
  batch1: "60000000-0000-4000-8000-000000000001",
  batch2: "60000000-0000-4000-8000-000000000002",
  batch3: "60000000-0000-4000-8000-000000000003",
  batch4: "60000000-0000-4000-8000-000000000004",
  batch5: "60000000-0000-4000-8000-000000000005",
  inventory1: "80000000-0000-4000-8000-000000000001",
  inventory2: "80000000-0000-4000-8000-000000000002",
  inventory3: "80000000-0000-4000-8000-000000000003",
  listing1: "90000000-0000-4000-8000-000000000001",
  listingImage1: "91000000-0000-4000-8000-000000000001",
  listingImage2: "91000000-0000-4000-8000-000000000002",
}

async function upsertUser(db, id, email, name, role, password, verified = false) {
  await db.execute(
    `INSERT INTO users (id, email, password, fullName, role, phone, address, isVerified, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE fullName = VALUES(fullName), role = VALUES(role), isVerified = VALUES(isVerified), updatedAt = NOW()`,
    [id, email, password, name, role, "081200000000", "Bandung", verified]
  )
}

async function main() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root12345",
    database: process.env.DB_NAME || "sampahkita",
  })

  const password = await bcrypt.hash("Demo123!", 10)

  await upsertUser(db, ids.household1, "demo.household1@cuansampah.test", "Demo Rumah Tangga 1", "HOUSEHOLD", password)
  await upsertUser(db, ids.household2, "demo.household2@cuansampah.test", "Demo Rumah Tangga 2", "HOUSEHOLD", password)
  await upsertUser(db, ids.household3, "demo.household3@cuansampah.test", "Demo Rumah Tangga 3", "HOUSEHOLD", password)
  await upsertUser(db, ids.household4, "demo.household4@cuansampah.test", "Demo Rumah Tangga 4", "HOUSEHOLD", password)
  await upsertUser(db, ids.collector1, "demo.collector1@cuansampah.test", "Demo Pengepul 1", "COLLECTOR", password, true)
  await upsertUser(db, ids.collector2, "demo.collector2@cuansampah.test", "Demo Pengepul 2", "COLLECTOR", password, true)
  await upsertUser(db, ids.recycler, "demo.recycler@cuansampah.test", "Demo Recycler", "RECYCLER", password, true)

  for (const [index, collectorId] of [ids.collector1, ids.collector2].entries()) {
    await db.execute(
      `INSERT INTO collector_verifications (id, collectorId, status, createdAt, updatedAt)
       VALUES (?, ?, "APPROVED", NOW(), NOW())
       ON DUPLICATE KEY UPDATE status = "APPROVED", updatedAt = NOW()`,
      [`70000000-0000-4000-8000-00000000000${index + 1}`, collectorId]
    )
  }

  await db.execute(
    `INSERT INTO sampah_requests (id, householdId, collectorId, status, sampahTypes, estimatedWeight, actualWeight, addressDetail, contactPhone, createdAt, updatedAt)
     VALUES (?, ?, ?, "COMPLETED", ?, 2.5, 2.5, "Jl. Demo CuanSampah, Bandung", "081200000001", NOW(), NOW())
     ON DUPLICATE KEY UPDATE collectorId = VALUES(collectorId), status = "COMPLETED", actualWeight = 2.5, contactPhone = VALUES(contactPhone), updatedAt = NOW()`,
    [ids.request, ids.household1, ids.collector1, '["kertas"]']
  )
  await db.execute(
    `INSERT INTO points_ledger (id, userId, amount, type, requestId, description, createdAt)
     VALUES (?, ?, 650, "EARNED", ?, "Demo poin UAS - pickup selesai", NOW())
     ON DUPLICATE KEY UPDATE amount = 650, description = VALUES(description)`,
    [ids.ledger, ids.household1, ids.request]
  )
  await db.execute(
    `INSERT INTO reward_redemptions (id, userId, rewardCode, rewardName, pointsCost, status, createdAt, updatedAt)
     VALUES (?, ?, "VOUCHER_5000", "Voucher Rp5.000", 100, "PENDING", NOW(), NOW())
     ON DUPLICATE KEY UPDATE status = VALUES(status), updatedAt = NOW()`,
    [ids.reward1, ids.household1]
  )
  await db.execute(
    `INSERT INTO points_ledger (id, userId, amount, type, requestId, description, createdAt)
     VALUES (?, ?, 100, "REDEEMED", NULL, "Redeem Voucher Rp5.000", NOW())
     ON DUPLICATE KEY UPDATE amount = 100, description = VALUES(description)`,
    [ids.redeemLedger, ids.household1]
  )
  for (const badge of [[ids.badge1, "Eco Starter", 100], [ids.badge2, "Eco Contributor", 500]]) {
    await db.execute(
      `INSERT INTO user_badges (id, userId, badgeName, thresholdPoints, earnedAt)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE thresholdPoints = VALUES(thresholdPoints)`,
      [badge[0], ids.household1, badge[1], badge[2]]
    )
  }

  const batches = [
    [ids.batch1, ids.collector1, null, "plastik", 45, 2500, "A", "Gudang Bandung Utara", "Plastik terpilah dan siap diproses.", "AVAILABLE", null, null, null, null, null, null, null, null, null, null],
    [ids.batch2, ids.collector1, ids.recycler, "kertas", 30, 1500, "B", "Gudang Bandung Utara", "Kertas kardus kering.", "OFFER_SUBMITTED", 60000, null, null, null, null, "Penawaran awal recycler demo.", null, null, null, null],
    [ids.batch3, ids.collector2, ids.recycler, "logam", 18, 5000, "A", "Gudang Bandung Selatan", "Logam campuran terpilah.", "COUNTER_OFFERED", 95000, 110000, null, null, null, "Penawaran awal recycler demo.", "Harga collector demo.", null, null, null],
    [ids.batch4, ids.collector1, ids.recycler, "plastik", 25, 2600, "A", "Gudang Bandung Utara", "Material siap dikirim ke recycler.", "IN_DELIVERY", 65000, null, 60000, 3000, 57000, "Deal collector-recycler demo.", null, "Sedang dikirim ke recycler.", null, null],
    [ids.batch5, ids.collector2, ids.recycler, "kertas", 20, 1800, "B", "Gudang Bandung Selatan", "Transaksi demo selesai.", "COMPLETED", 36000, null, 34000, 1700, 32300, "Transaksi demo selesai.", null, "Material sudah diserahkan.", "2026-06-03 10:00:00", "2026-06-03 10:05:00"],
  ]
  for (const batch of batches) {
    await db.execute(
      `INSERT INTO material_batches (id, collectorId, recyclerId, wasteType, totalWeight, pricePerKg, grade, location, description, status, offerPrice, counterPrice, agreedPrice, platformFee, collectorEarning, offerNote, counterNote, deliveryNote, deliveredAt, completedAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE recyclerId = VALUES(recyclerId), wasteType = VALUES(wasteType), totalWeight = VALUES(totalWeight), pricePerKg = VALUES(pricePerKg), grade = VALUES(grade), location = VALUES(location), description = VALUES(description), status = VALUES(status), offerPrice = VALUES(offerPrice), counterPrice = VALUES(counterPrice), agreedPrice = VALUES(agreedPrice), platformFee = VALUES(platformFee), collectorEarning = VALUES(collectorEarning), offerNote = VALUES(offerNote), counterNote = VALUES(counterNote), deliveryNote = VALUES(deliveryNote), deliveredAt = VALUES(deliveredAt), completedAt = VALUES(completedAt), updatedAt = NOW()`,
      batch
    )
  }

  for (const inventory of [
    [ids.inventory1, ids.collector1, "plastik", 75],
    [ids.inventory2, ids.collector1, "kertas", 25],
    [ids.inventory3, ids.collector2, "logam", 40],
  ]) {
    await db.execute(
      `INSERT INTO collector_inventory (id, collectorId, wasteType, availableWeight, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE availableWeight = VALUES(availableWeight), updatedAt = NOW()`,
      inventory
    )
  }

  await db.execute(
    `INSERT INTO bid_listings (id, sellerId, title, description, contactName, contactPhone, photoUrl, minPrice, maxPrice, currentPrice, priceStep, status, winnerId, expiresAt, createdAt, updatedAt)
     VALUES (?, ?, "Kipas angin bekas layak pakai", "Barang demo PasarCuan dengan dua gambar dan kontak penjual.", "Demo Seller", "081200000001", "/uploads/demo-pasarcuan-1.jpg", 25000, 75000, 25000, 5000, "ACTIVE", NULL, DATE_ADD(NOW(), INTERVAL 1 DAY), NOW(), NOW())
     ON DUPLICATE KEY UPDATE contactName = VALUES(contactName), contactPhone = VALUES(contactPhone), status = "ACTIVE", updatedAt = NOW()`,
    [ids.listing1, ids.household1]
  )
  for (const image of [
    [ids.listingImage1, ids.listing1, "/uploads/demo-pasarcuan-1.jpg", 0],
    [ids.listingImage2, ids.listing1, "/uploads/demo-pasarcuan-2.jpg", 1],
  ]) {
    await db.execute(
      `INSERT INTO listing_images (id, listingId, imageUrl, sortOrder, createdAt)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE imageUrl = VALUES(imageUrl), sortOrder = VALUES(sortOrder)`,
      image
    )
  }

  await db.end()
  console.log("Demo seed selesai. Password seluruh akun demo: Demo123!")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
