const mysql = require("mysql2/promise");
require("dotenv").config();

async function main() {
  const db = await mysql.createConnection(process.env.DATABASE_URL);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS bids (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      listingId VARCHAR(191) NOT NULL,
      bidderId VARCHAR(191) NOT NULL,
      amount INT NOT NULL,
      message TEXT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX bids_listingId_idx (listingId),
      INDEX bids_bidderId_idx (bidderId),
      INDEX bids_amount_idx (amount)
    )
  `);

  console.log("Tabel bids sudah siap.");

  const [tables] = await db.query("SHOW TABLES LIKE 'bids'");
  console.table(tables);

  await db.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
