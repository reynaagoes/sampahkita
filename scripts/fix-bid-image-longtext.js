const mysql = require("mysql2/promise");
require("dotenv").config();

async function main() {
  const db = await mysql.createConnection(process.env.DATABASE_URL);

  await db.execute(`
    ALTER TABLE bid_listings
    MODIFY photoUrl LONGTEXT NULL
  `);

  await db.execute(`
    ALTER TABLE listing_images
    MODIFY imageUrl LONGTEXT NOT NULL
  `);

  console.log("Kolom foto PasarCuan sudah LONGTEXT.");
  await db.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
