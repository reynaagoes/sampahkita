const mysql = require("mysql2/promise")

async function hasColumn(db, table, column) {
  const [rows] = await db.execute(
    "SELECT COUNT(*) AS total FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
    [table, column]
  )
  return Number(rows[0].total) > 0
}

async function main() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root12345",
    database: process.env.DB_NAME || "sampahkita",
  })

  await db.execute(
    `ALTER TABLE sampah_requests
     MODIFY status ENUM("OPEN","ASSIGNED","ON_THE_WAY","ARRIVED","PICKED_UP","WEIGHED","COMPLETED","CANCELLED")
     NOT NULL DEFAULT "OPEN"`
  )
  await db.execute('UPDATE sampah_requests SET status = "WEIGHED" WHERE status = "PICKED_UP"')
  await db.execute(
    `ALTER TABLE sampah_requests
     MODIFY status ENUM("OPEN","ASSIGNED","ON_THE_WAY","ARRIVED","WEIGHED","COMPLETED","CANCELLED")
     NOT NULL DEFAULT "OPEN"`
  )

  if (!(await hasColumn(db, "material_batches", "grade"))) {
    await db.execute('ALTER TABLE material_batches ADD COLUMN grade VARCHAR(20) NOT NULL DEFAULT "B" AFTER pricePerKg')
  }
  if (!(await hasColumn(db, "sampah_requests", "contactPhone"))) {
    await db.execute("ALTER TABLE sampah_requests ADD COLUMN contactPhone VARCHAR(50) NULL AFTER addressDetail")
  }
  if (!(await hasColumn(db, "bid_listings", "contactName"))) {
    await db.execute("ALTER TABLE bid_listings ADD COLUMN contactName VARCHAR(191) NULL AFTER description")
  }
  if (!(await hasColumn(db, "bid_listings", "contactPhone"))) {
    await db.execute("ALTER TABLE bid_listings ADD COLUMN contactPhone VARCHAR(50) NULL AFTER contactName")
  }
  await db.execute('UPDATE material_batches SET status = "COMPLETED" WHERE status = "SOLD"')
  await db.execute(
    `ALTER TABLE material_batches
     MODIFY status ENUM("AVAILABLE","PURCHASE_REQUESTED","APPROVED","REJECTED","DELIVERED","COMPLETED")
     NOT NULL DEFAULT "AVAILABLE"`
  )

  await db.execute(
    `CREATE TABLE IF NOT EXISTS collector_inventory (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      collectorId VARCHAR(191) NOT NULL,
      wasteType VARCHAR(50) NOT NULL,
      availableWeight DECIMAL(10,2) NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL,
      updatedAt DATETIME NOT NULL,
      UNIQUE KEY collector_inventory_material (collectorId, wasteType)
    )`
  )
  await db.execute(
    `CREATE TABLE IF NOT EXISTS user_badges (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      userId VARCHAR(191) NOT NULL,
      badgeName VARCHAR(100) NOT NULL,
      thresholdPoints INT NOT NULL,
      earnedAt DATETIME NOT NULL,
      UNIQUE KEY user_badge_unique (userId, badgeName)
    )`
  )
  await db.execute(
    `CREATE TABLE IF NOT EXISTS reward_redemptions (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      userId VARCHAR(191) NOT NULL,
      rewardCode VARCHAR(100) NOT NULL,
      rewardName VARCHAR(191) NOT NULL,
      pointsCost INT NOT NULL,
      status ENUM("PENDING","CLAIMED") NOT NULL DEFAULT "PENDING",
      createdAt DATETIME NOT NULL,
      updatedAt DATETIME NOT NULL
    )`
  )
  await db.execute(
    `CREATE TABLE IF NOT EXISTS listing_images (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      listingId VARCHAR(36) NOT NULL,
      imageUrl TEXT NOT NULL,
      sortOrder INT NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL,
      KEY listing_images_listing (listingId)
    )`
  )
  await db.execute("ALTER TABLE listing_images CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")

  await db.end()
  console.log("Migrasi workflow selesai.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
