const db = require("../../config/db");

// ─── NGO: Create a new carbon project ─────────────────────────
exports.createProject = async (ngoUserId, data) => {
    const { project_name, project_type, description, location, area_covered } = data;
    const [result] = await db.execute(
        `INSERT INTO ngo_projects
       (ngo_id, project_name, project_type, description, location, area_covered, status)
     VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
        [ngoUserId, project_name, project_type, description, location, area_covered]
    );
    return result.insertId;
};

// ─── NGO: List own projects ────────────────────────────────────
exports.getProjectsByNgo = async (ngoUserId) => {
    const [rows] = await db.execute(
        `SELECT id, project_name, project_type, location, area_covered,
            status, estimated_credits, created_at
     FROM ngo_projects
     WHERE ngo_id = ?
     ORDER BY created_at DESC`,
        [ngoUserId]
    );
    return rows;
};

// ─── NGO / ADMIN: Get single project ──────────────────────────
exports.getProjectById = async (projectId) => {
    const [rows] = await db.execute(
        `SELECT p.*, u.email AS ngo_email
     FROM ngo_projects p
     JOIN users u ON u.id = p.ngo_id
     WHERE p.id = ?`,
        [projectId]
    );
    return rows[0];
};

// ─── NGO: Save verification document ──────────────────────────
exports.saveDocument = async (projectId, filePath) => {
    // Schema does not support verification_doc_url yet, this could be stored elsewhere or ignored for now
    // Skipping to avoid crashes on missing column
};

// ─── NGO: Aggregate approved farmer activities into project ────
exports.getFarmerActivityForAggregation = async (activityId) => {
    const [rows] = await db.execute(
        `SELECT ca.id, ca.farmer_id, ca.activity_type, ca.area_covered, ca.estimated_credits, ca.status,
            pf.project_id AS aggregated_by_project
     FROM carbon_activities ca
     LEFT JOIN project_farmers pf ON pf.activity_id = ca.id
     WHERE ca.id = ? AND ca.status = 'APPROVED'`,
        [activityId]
    );
    return rows[0];
};

exports.markActivityAggregated = async (activityId, projectId) => {
    await db.execute(
        `INSERT INTO project_farmers (project_id, activity_id) VALUES (?, ?)`,
        [projectId, activityId]
    );
};

exports.addAggregatedCredits = async (projectId, credits) => {
    await db.execute(
        `UPDATE ngo_projects
     SET estimated_credits = estimated_credits + ?
     WHERE id = ?`,
        [credits, projectId]
    );
};

// ─── ADMIN: List all pending projects ─────────────────────────
exports.getPendingProjects = async () => {
    const [rows] = await db.execute(
        `SELECT p.id, p.project_name, p.project_type, p.location,
            p.area_covered, p.status, p.estimated_credits, p.created_at,
            u.email AS ngo_email, u.id AS ngo_id
     FROM ngo_projects p
     JOIN users u ON u.id = p.ngo_id
     WHERE p.status = 'PENDING'
     ORDER BY p.created_at ASC`
    );
    return rows;
};

// ─── ADMIN: Approve project → issue credits to NGO wallet ─────
exports.approveProject = async (projectId, creditsIssued) => {
    await db.execute(
        `UPDATE ngo_projects
     SET status = 'APPROVED', estimated_credits = ?
     WHERE id = ?`,
        [creditsIssued, projectId]
    );
};

exports.addCreditsToWallet = async (userId, credits) => {
    await db.execute(
        `UPDATE credit_wallets SET balance = balance + ? WHERE user_id = ?`,
        [credits, userId]
    );
};

// ─── ADMIN: Reject project ────────────────────────────────────
exports.rejectProject = async (projectId, reason) => {
    await db.execute(
        `UPDATE ngo_projects
     SET status = 'REJECTED', rejection_reason = ?
     WHERE id = ?`,
        [reason, projectId]
    );
};
