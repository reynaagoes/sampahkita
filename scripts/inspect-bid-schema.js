const mysql = require("mysql2/promise");
require("dotenv").config();

async function main() {
  const db = await mysql.createConnection(process.env.DATABASE_URL);

  for (const table of ["bid_listings", "listing_images", "bids"]) {
    console.log("\nTABLE:", table);
    const [rows] = await db.query(`DESCRIBE ${table}`);
    console.table(rows);
  }

  await db.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
