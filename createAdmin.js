const bcrypt = require("bcrypt");
const db = require("./config/db");

async function createAdmin() {
  const hash = await bcrypt.hash("Admin@123", 10);

  await db.execute(
    `INSERT INTO users (email, phone, password_hash, role, status)
     VALUES (?, ?, ?, 'ADMIN', 'ACTIVE')`,
    ["admin@carbonsetu.com", "9999999999", hash]
  );

  console.log("Admin created");
}

createAdmin();