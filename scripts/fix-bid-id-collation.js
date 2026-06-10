const mysql = require("mysql2/promise");
require("dotenv").config();

async function main() {
  const db = await mysql.createConnection(process.env.DATABASE_URL);

  const queries = [
    `ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    `ALTER TABLE bid_listings CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    `ALTER TABLE listing_images CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    `ALTER TABLE bids CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

    `ALTER TABLE users MODIFY id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL`,
    `ALTER TABLE bid_listings MODIFY id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL`,
    `ALTER TABLE bid_listings MODIFY sellerId VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL`,
    `ALTER TABLE listing_images MODIFY listingId VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL`,
    `ALTER TABLE bids MODIFY listingId VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL`,
    `ALTER TABLE bids MODIFY bidderId VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL`,
  ];

  for (const q of queries) {
    console.log("RUN:", q);
    await db.execute(q);
  }

  console.log("Collation ID PasarCuan sudah disamakan.");

  await db.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
