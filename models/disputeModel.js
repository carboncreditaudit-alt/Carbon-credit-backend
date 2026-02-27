const db = require("../config/db");

// ─── Raise a dispute ──────────────────────────────────────────
exports.createDispute = async (raisedBy, data) => {
    const { order_id, dispute_type, description } = data;
    const [result] = await db.execute(
        `INSERT INTO disputes
       (raised_by, order_id, dispute_type, description, status)
     VALUES (?, ?, ?, ?, 'OPEN')`,
        [raisedBy, order_id || null, dispute_type, description]
    );
    return result.insertId;
};

// ─── List own disputes ────────────────────────────────────────
exports.getDisputesByUser = async (userId) => {
    const [rows] = await db.execute(
        `SELECT d.id, d.dispute_type, d.description, d.status,
            d.admin_resolution, d.created_at,
            u.email AS raised_by_email,
            o.credits_purchased AS order_credits
     FROM disputes d
     JOIN users u ON u.id = d.raised_by
     LEFT JOIN orders o ON o.id = d.order_id
     WHERE d.raised_by = ?
     ORDER BY d.created_at DESC`,
        [userId]
    );
    return rows;
};

// ─── Get dispute by ID ────────────────────────────────────────
exports.getDisputeById = async (disputeId) => {
    const [rows] = await db.execute(
        `SELECT d.*,
            u.email  AS raised_by_email,
            u.role   AS raised_by_role,
            o.buyer_id, o.seller_id, o.credits_purchased,
            o.total_amount AS order_amount
     FROM disputes d
     JOIN users u ON u.id = d.raised_by
     LEFT JOIN orders o ON o.id = d.order_id
     WHERE d.id = ?`,
        [disputeId]
    );
    return rows[0];
};

// ─── ADMIN: Get all disputes with optional filter ─────────────
exports.getAllDisputes = async (status) => {
    let query = `
    SELECT d.id, d.dispute_type, d.status, d.created_at,
           d.admin_resolution, d.resolved_at,
           u.email AS raised_by_email, u.role AS raised_by_role,
           o.id AS order_id, o.total_amount
    FROM disputes d
    JOIN users u ON u.id = d.raised_by
    LEFT JOIN orders o ON o.id = d.order_id
  `;
    const params = [];
    if (status) {
        query += ` WHERE d.status = ?`;
        params.push(status);
    }
    query += ` ORDER BY d.created_at DESC`;

    const [rows] = await db.execute(query, params);
    return rows;
};

// ─── ADMIN: Resolve dispute ───────────────────────────────────
exports.resolveDispute = async (disputeId, adminId, resolution, decision) => {
    await db.execute(
        `UPDATE disputes
     SET status = 'RESOLVED',
         admin_resolution = ?,
         decision = ?,
         resolved_at = NOW()
     WHERE id = ?`,
        [resolution, decision, disputeId]
    );
};

// ─── ADMIN: Close dispute (no resolution needed) ──────────────
exports.closeDispute = async (disputeId, adminId, note) => {
    await db.execute(
        `UPDATE disputes
     SET status = 'CLOSED',
         admin_resolution = ?,
         resolved_at = NOW()
     WHERE id = ?`,
        [note || "Closed by admin", disputeId]
    );
};
