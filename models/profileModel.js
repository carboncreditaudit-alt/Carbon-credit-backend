const db = require("../config/db");

// Get base user info
exports.getUserById = async (userId) => {
  const [rows] = await db.execute(
    `SELECT id, email, phone, role
     FROM users
     WHERE id = ?`,
    [userId]
  );
  return rows[0];
};

// Farmer profile
exports.getFarmerProfile = async (userId) => {
  const [rows] = await db.execute(
    `SELECT land_size, location, bank_account
     FROM farmers
     WHERE user_id = ?`,
    [userId]
  );
  return rows[0];
};

// NGO profile
exports.getNgoProfile = async (userId) => {
  const [rows] = await db.execute(
    `SELECT organization_name, registration_number
     FROM ngos
     WHERE user_id = ?`,
    [userId]
  );
  return rows[0];
};

// Company profile
exports.getCompanyProfile = async (userId) => {
  const [rows] = await db.execute(
    `SELECT company_name, esg_document_url
     FROM companies
     WHERE user_id = ?`,
    [userId]
  );
  return rows[0];
};