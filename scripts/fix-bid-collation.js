const mysql = require("mysql2/promise");
require("dotenv").config();

async function main() {
  const db = await mysql.createConnection(process.env.DATABASE_URL);

  const tables = [
    "users",
    "bid_listings",
    "listing_images",
    "bids"
  ];

  await db.execute(`
    ALTER DATABASE railway
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci
  `);

  for (const table of tables) {
    console.log("Fix collation:", table);
    await db.execute(`
      ALTER TABLE \`${table}\`
      CONVERT TO CHARACTER SET utf8mb4
      COLLATE utf8mb4_unicode_ci
    `);
  }

  console.log("Collation PasarCuan sudah disamakan.");

  await db.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
