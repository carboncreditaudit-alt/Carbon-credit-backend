const db = require("../config/db");

// Create user
exports.createUser = async (email, phone, passwordHash, role) => {
  const [result] = await db.execute(
    `INSERT INTO users (email, phone, password_hash, role, status)
     VALUES (?, ?, ?, ?, 'PENDING')`,
    [email, phone, passwordHash, role]
  );
  return result.insertId;
};

// Create Farmer Profile
exports.createFarmerProfile = async (userId, profile) => {
  await db.execute(
    `INSERT INTO farmers (user_id, land_size, location, bank_account)
     VALUES (?, ?, ?, ?)`,
    [userId, profile.land_size, profile.location, profile.bank_account]
  );
};

// Create NGO Profile
exports.createNgoProfile = async (userId, profile) => {
  await db.execute(
    `INSERT INTO ngos (user_id, organization_name, registration_number)
     VALUES (?, ?, ?)`,
    [userId, profile.organization_name, profile.registration_number]
  );
};

// Create Company Profile
exports.createCompanyProfile = async (userId, profile) => {
  await db.execute(
    `INSERT INTO companies (user_id, company_name, esg_document_url)
     VALUES (?, ?, ?)`,
    [userId, profile.company_name, profile.esg_document_url]
  );
};

// Create Wallet
exports.createWallet = async (userId) => {
  await db.execute(
    `INSERT INTO credit_wallets (user_id) VALUES (?)`,
    [userId]
  );
};

// Find user by email
exports.findUserByEmail = async (email) => {
  const [rows] = await db.execute(
    `SELECT id, email, phone, password_hash, role, status
     FROM users
     WHERE email = ?`,
    [email]
  );

  return rows[0];
};