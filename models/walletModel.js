const db = require("../config/db");

// ─── Get wallet balance ────────────────────────────────────────
exports.getWallet = async (userId) => {
    const [rows] = await db.execute(
        `SELECT
            cw.user_id,
            cw.balance,
            cw.created_at AS updated_at,
            (SELECT COALESCE(SUM(seller_payout), 0) FROM orders WHERE seller_id = cw.user_id AND status = 'COMPLETED') AS fiat_balance
         FROM credit_wallets cw
         WHERE cw.user_id = ?`,
        [userId]
    );
    return rows[0];
};

// ─── Get credit transactions ───────────────────────────────────
// Combines: activities approved, projects approved, purchases/sales, retirements
exports.getTransactions = async (userId) => {
    // Activity credits issued (Farmer)
    const [activityCredits] = await db.execute(
        `SELECT
       'CREDIT_EARNED'        AS type,
       estimated_credits      AS amount,
       activity_type          AS description,
       created_at             AS created_at
     FROM carbon_activities
     WHERE farmer_id = ? AND status = 'APPROVED'`,
        [userId]
    );

    // NGO project credits issued
    const [projectCredits] = await db.execute(
        `SELECT
       'CREDIT_EARNED'  AS type,
       estimated_credits AS amount,
       project_name     AS description,
       created_at       AS created_at
     FROM ngo_projects
     WHERE ngo_id = ? AND status = 'APPROVED'`,
        [userId]
    );

    // Credits sold (outgoing)
    const [sales] = await db.execute(
        `SELECT
       'CREDIT_SOLD'        AS type,
       credits_purchased    AS amount,
       CONCAT('Sold to company #', buyer_id) AS description,
       created_at
     FROM orders
     WHERE seller_id = ? AND status = 'COMPLETED'`,
        [userId]
    );

    // Fiat earned from released escrow
    const [fiatEarnings] = await db.execute(
        `SELECT
       'FIAT_EARNED'        AS type,
       seller_payout        AS amount,
       CONCAT('Payment received from Escrow for Order #', id) AS description,
       released_at          AS created_at
     FROM orders
     WHERE seller_id = ? AND status = 'COMPLETED'`,
        [userId]
    );

    // Credits purchased (incoming for company)
    const [purchases] = await db.execute(
        `SELECT
       'CREDIT_PURCHASED'   AS type,
       credits_purchased    AS amount,
       CONCAT('Bought from listing #', listing_id) AS description,
       created_at
     FROM orders
     WHERE buyer_id = ? AND status = 'COMPLETED'`,
        [userId]
    );

    // Credits retired
    const [retirements] = await db.execute(
        `SELECT
       'CREDIT_RETIRED'   AS type,
       credits_retired    AS amount,
       retirement_purpose AS description,
       created_at
     FROM credit_retirements
     WHERE user_id = ?`,
        [userId]
    );

    // Merge and sort by created_at descending
    const all = [
        ...activityCredits,
        ...projectCredits,
        ...sales,
        ...purchases,
        ...retirements,
        ...fiatEarnings,
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return all;
};

// ─── Get owned credits (active, not sold/retired) ─────────────
exports.getOwnedCredits = async (userId) => {
    const [rows] = await db.execute(
        `SELECT id, credit_type, quantity, source_type, source_id,
            created_at AS acquired_at, status
     FROM user_credits
     WHERE owner_id = ? AND status = 'ACTIVE'
     ORDER BY created_at DESC`,
        [userId]
    );
    return rows;
};

// ─── Admin: View any user wallet ──────────────────────────────
exports.getWalletAdmin = async (userId) => {
    const [rows] = await db.execute(
        `SELECT cw.user_id, cw.balance, cw.created_at AS updated_at,
            u.email, u.role
     FROM credit_wallets cw
     JOIN users u ON u.id = cw.user_id
     WHERE cw.user_id = ?`,
        [userId]
    );
    return rows[0];
};