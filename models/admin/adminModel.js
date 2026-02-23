const db = require("../../config/db");

// Get pending users
exports.getPendingUsers = async () => {
  const [rows] = await db.execute(
    `SELECT id, email, role, created_at
     FROM users
     WHERE status = 'PENDING'`
  );
  return rows;
};

// Update user status
exports.updateUserStatus = async (userId, status) => {
  await db.execute(
    `UPDATE users SET status = ? WHERE id = ?`,
    [status, userId]
  );
};