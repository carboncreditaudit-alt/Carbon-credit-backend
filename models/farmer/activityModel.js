const db = require("../../config/db");

// ─── FARMER: Submit activity ───────────────────────────────────
exports.createActivity = async (userId, data) => {
    const { activity_type, description, area_covered, location } = data;
    const [result] = await db.execute(
        `INSERT INTO carbon_activities
       (farmer_id, activity_type, description, area_covered, location, status)
     VALUES (?, ?, ?, ?, ?, 'PENDING')`,
        [userId, activity_type, description, area_covered, location]
    );
    return result.insertId;
};

// ─── FARMER: List own activities ──────────────────────────────
exports.getActivitiesByFarmer = async (userId) => {
    const [rows] = await db.execute(
        `SELECT id, activity_type, description, area_covered, location,
            status, estimated_credits, proof_image_url, proof_gps, created_at
     FROM carbon_activities
     WHERE farmer_id = ?
     ORDER BY created_at DESC`,
        [userId]
    );
    return rows;
};

// ─── FARMER / ADMIN: Get single activity ──────────────────────
exports.getActivityById = async (activityId) => {
    const [rows] = await db.execute(
        `SELECT ca.*, u.email AS farmer_email
     FROM carbon_activities ca
     JOIN users u ON u.id = ca.farmer_id
     WHERE ca.id = ?`,
        [activityId]
    );
    return rows[0];
};

// ─── FARMER: Save proof (photo + GPS) ─────────────────────────
exports.updateProof = async (activityId, proofImageUrl, proofGps) => {
    await db.execute(
        `UPDATE carbon_activities
     SET proof_image_url = ?, proof_gps = ?
     WHERE id = ?`,
        [proofImageUrl, proofGps, activityId]
    );
};

// ─── FARMER: Credit estimate (read-only calculated value) ─────
exports.getEstimate = async (activityId) => {
    const [rows] = await db.execute(
        `SELECT id, farmer_id, activity_type, area_covered, estimated_credits
     FROM carbon_activities WHERE id = ?`,
        [activityId]
    );
    return rows[0];
};

// ─── ADMIN: List all pending activities ───────────────────────
exports.getPendingActivities = async () => {
    const [rows] = await db.execute(
        `SELECT ca.id, ca.activity_type, ca.area_covered, ca.location,
            ca.status, ca.proof_image_url, ca.proof_gps, ca.created_at,
            u.email AS farmer_email, u.id AS farmer_id
     FROM carbon_activities ca
     JOIN users u ON u.id = ca.farmer_id
     WHERE ca.status = 'PENDING'
     ORDER BY ca.created_at ASC`
    );
    return rows;
};

// ─── ADMIN: Approve → generate credits ────────────────────────
exports.approveActivity = async (activityId, creditsIssued) => {
    await db.execute(
        `UPDATE carbon_activities
     SET status = 'APPROVED', estimated_credits = ?, reviewed_at = NOW()
     WHERE id = ?`,
        [creditsIssued, activityId]
    );
};

// ─── ADMIN: Issue credits to farmer wallet ────────────────────
exports.addCreditsToWallet = async (userId, credits) => {
    await db.execute(
        `UPDATE credit_wallets
     SET balance = balance + ?
     WHERE user_id = ?`,
        [credits, userId]
    );
};

// ─── ADMIN: Reject activity ───────────────────────────────────
exports.rejectActivity = async (activityId, reason) => {
    await db.execute(
        `UPDATE carbon_activities
     SET status = 'REJECTED', rejection_reason = ?, reviewed_at = NOW()
     WHERE id = ?`,
        [reason, activityId]
    );
};

// ─── ADMIN: Request more proof ────────────────────────────────
exports.requestMoreProof = async (activityId, note) => {
    await db.execute(
        `UPDATE carbon_activities
     SET status = 'PROOF_REQUESTED', admin_note = ?
     WHERE id = ?`,
        [note, activityId]
    );
};
