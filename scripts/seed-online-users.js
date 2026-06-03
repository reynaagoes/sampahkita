const mysql = require("mysql2/promise");
require("dotenv").config();

const PASSWORD_HASH = "$2b$10$TsyuicJDxUiztAH6Mxprie4gvdm5/0SoVYlAGRFusZ5LHN3TyREnW";

async function main() {
  const db = await mysql.createConnection(process.env.DATABASE_URL);

  const users = [
    ["demo.household1@cuansampah.test", "Demo Rumah Tangga 1", "HOUSEHOLD", "081200000000", "Bandung", 1],
    ["demo.collector1@cuansampah.test", "Demo Pengepul 1", "COLLECTOR", "081200000000", "Bandung", 1],
    ["demo.recycler@cuansampah.test", "Demo Recycler", "RECYCLER", "081200000000", "Bandung", 1],
    ["admin@sampahkita.com", "Admin CuanSampah", "ADMIN", "081200000000", "Bandung", 1]
  ];

  for (const [email, fullName, role, phone, address, isVerified] of users) {
    await db.execute(
      `
      INSERT INTO users (
        id, email, password, fullName, role, phone, address, isVerified, createdAt, updatedAt
      )
      VALUES (
        UUID(), ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
      )
      ON DUPLICATE KEY UPDATE
        password = VALUES(password),
        fullName = VALUES(fullName),
        role = VALUES(role),
        phone = VALUES(phone),
        address = VALUES(address),
        isVerified = VALUES(isVerified),
        updatedAt = NOW()
      `,
      [email, PASSWORD_HASH, fullName, role, phone, address, isVerified]
    );
  }

  const [rows] = await db.query("SELECT email, fullName, role, isVerified FROM users");
  console.table(rows);

  await db.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
