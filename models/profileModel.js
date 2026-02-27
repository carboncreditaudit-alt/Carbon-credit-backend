const db = require("../config/db");

// ─── GET PROFILE ──────────────────────────────────────────────

// Get base user info
exports.getUserById = async (userId) => {
  const [rows] = await db.execute(
    `SELECT id, email, phone, role, status, terms_accepted
     FROM users WHERE id = ?`,
    [userId]
  );
  return rows[0];
};

// Farmer profile
exports.getFarmerProfile = async (userId) => {
  const [rows] = await db.execute(
    `SELECT land_size, location, bank_account, bank_name, ifsc_code
     FROM farmers WHERE user_id = ?`,
    [userId]
  );
  return rows[0];
};

// NGO profile
exports.getNgoProfile = async (userId) => {
  const [rows] = await db.execute(
    `SELECT organization_name, registration_number, bank_account, bank_name, ifsc_code
     FROM ngos WHERE user_id = ?`,
    [userId]
  );
  return rows[0];
};

// Company profile
exports.getCompanyProfile = async (userId) => {
  const [rows] = await db.execute(
    `SELECT company_name, esg_document_url, payment_method
     FROM companies WHERE user_id = ?`,
    [userId]
  );
  return rows[0];
};

// ─── UPDATE PROFILE ───────────────────────────────────────────

exports.updateFarmerProfile = async (userId, data) => {
  const { land_size, location } = data;
  await db.execute(
    `UPDATE farmers SET land_size = ?, location = ? WHERE user_id = ?`,
    [land_size || null, location || null, userId]
  );
};

exports.updateNgoProfile = async (userId, data) => {
  const { organization_name, registration_number } = data;
  await db.execute(
    `UPDATE ngos SET organization_name = ?, registration_number = ? WHERE user_id = ?`,
    [organization_name || null, registration_number || null, userId]
  );
};

exports.updateCompanyProfile = async (userId, data) => {
  const { company_name } = data;
  await db.execute(
    `UPDATE companies SET company_name = ? WHERE user_id = ?`,
    [company_name || null, userId]
  );
};

// ─── BANK ACCOUNT ─────────────────────────────────────────────

// Farmer & NGO bank account update
exports.updateBankAccount = async (userId, role, data) => {
  const { account_number, bank_name, ifsc_code } = data;
  const table = role === "FARMER" ? "farmers" : "ngos";
  await db.execute(
    `UPDATE ${table} SET bank_account = ?, bank_name = ?, ifsc_code = ? WHERE user_id = ?`,
    [account_number, bank_name, ifsc_code, userId]
  );
};

// ─── PAYMENT METHOD ───────────────────────────────────────────

// Company payment method update
exports.updatePaymentMethod = async (userId, paymentMethod) => {
  await db.execute(
    `UPDATE companies SET payment_method = ? WHERE user_id = ?`,
    [paymentMethod, userId]
  );
};

// ─── KYC ──────────────────────────────────────────────────────

exports.upsertKycRecord = async (userId, filePath) => {
  await db.execute(
    `INSERT INTO kyc_documents (user_id, file_path, status, submitted_at)
     VALUES (?, ?, 'PENDING', NOW())
     ON DUPLICATE KEY UPDATE file_path = VALUES(file_path), status = 'PENDING', submitted_at = NOW()`,
    [userId, filePath]
  );
};

exports.getKycRecord = async (userId) => {
  const [rows] = await db.execute(
    `SELECT user_id, file_path, status, submitted_at, reviewed_at
     FROM kyc_documents WHERE user_id = ?`,
    [userId]
  );
  return rows[0];
};

// ─── TERMS ────────────────────────────────────────────────────

exports.acceptTerms = async (userId) => {
  await db.execute(
    `UPDATE users SET terms_accepted = 1 WHERE id = ?`,
    [userId]
  );
};

// ─── ADMIN ────────────────────────────────────────────────────

exports.getAllUsers = async (filters = {}) => {
  let query = `SELECT id, email, phone, role, status, terms_accepted FROM users WHERE 1=1`;
  const params = [];

  if (filters.role) {
    query += ` AND role = ?`;
    params.push(filters.role);
  }
  if (filters.status) {
    query += ` AND status = ?`;
    params.push(filters.status);
  }

  const [rows] = await db.execute(query, params);
  return rows;
};

exports.getUserByIdAdmin = async (userId) => {
  const [rows] = await db.execute(
    `SELECT id, email, phone, role, status, terms_accepted FROM users WHERE id = ?`,
    [userId]
  );
  return rows[0];
};