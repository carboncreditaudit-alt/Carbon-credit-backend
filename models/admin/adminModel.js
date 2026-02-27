const db = require("../../config/db");

// ─── USER STATUS ──────────────────────────────────────────────

// Get all pending users (with phone for context)
exports.getPendingUsers = async () => {
  const [rows] = await db.execute(
    `SELECT id, email, phone, role, created_at
     FROM users
     WHERE status = 'PENDING'`
  );
  return rows;
};

// Update user status (ACTIVE | SUSPENDED)
exports.updateUserStatus = async (userId, status) => {
  await db.execute(
    `UPDATE users SET status = ? WHERE id = ?`,
    [status, userId]
  );
};

// Save rejection reason in a dedicated column
exports.setRejectionReason = async (userId, reason) => {
  await db.execute(
    `UPDATE users SET status = 'SUSPENDED', rejection_reason = ? WHERE id = ?`,
    [reason, userId]
  );
};

// Get single user for admin detail view
exports.getUserById = async (userId) => {
  const [rows] = await db.execute(
    `SELECT id, email, phone, role, status, terms_accepted, rejection_reason, created_at
     FROM users WHERE id = ?`,
    [userId]
  );
  return rows[0];
};

// ─── KYC ──────────────────────────────────────────────────────

// Get KYC record for a specific user
exports.getKycByUserId = async (userId) => {
  const [rows] = await db.execute(
    `SELECT user_id, file_path, status, submitted_at, reviewed_at
     FROM kyc_documents WHERE user_id = ?`,
    [userId]
  );
  return rows[0];
};

// Get all pending KYC submissions
exports.getPendingKyc = async () => {
  const [rows] = await db.execute(
    `SELECT k.user_id, u.email, u.role, k.file_path, k.status, k.submitted_at
     FROM kyc_documents k
     JOIN users u ON u.id = k.user_id
     WHERE k.status = 'PENDING'`
  );
  return rows;
};

// Approve or reject KYC
exports.updateKycStatus = async (userId, status) => {
  await db.execute(
    `UPDATE kyc_documents
     SET status = ?, reviewed_at = NOW()
     WHERE user_id = ?`,
    [status, userId]
  );
};