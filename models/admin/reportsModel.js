const db = require("../../config/db");

// ─── Credits Issued Report ────────────────────────────────────
// Credits issued from farmer activities + NGO projects over time
exports.getCreditsIssued = async ({ from, to, group_by = "month" } = {}) => {
    // Farmer activity credits
    const [activityCredits] = await db.execute(
        `SELECT
       DATE_FORMAT(created_at, ?) AS period,
       COUNT(*)                    AS total_activities,
       SUM(estimated_credits)      AS total_credits
     FROM carbon_activities
     WHERE status = 'APPROVED'
       ${from ? "AND reviewed_at >= ?" : ""}
       ${to ? "AND reviewed_at <= ?" : ""}
     GROUP BY period
     ORDER BY period ASC`,
        [
            group_by === "day" ? "%Y-%m-%d" : group_by === "year" ? "%Y" : "%Y-%m",
            ...(from ? [from] : []),
            ...(to ? [to] : []),
        ]
    );

    // NGO project credits
    const [projectCredits] = await db.execute(
        `SELECT
       DATE_FORMAT(created_at, ?) AS period,
       COUNT(*)                    AS total_projects,
       SUM(estimated_credits)      AS total_credits
     FROM ngo_projects
     WHERE status = 'APPROVED'
       ${from ? "AND reviewed_at >= ?" : ""}
       ${to ? "AND reviewed_at <= ?" : ""}
     GROUP BY period
     ORDER BY period ASC`,
        [
            group_by === "day" ? "%Y-%m-%d" : group_by === "year" ? "%Y" : "%Y-%m",
            ...(from ? [from] : []),
            ...(to ? [to] : []),
        ]
    );

    // Totals
    const [[actTotals]] = await db.execute(
        `SELECT COUNT(*) AS count, COALESCE(SUM(estimated_credits), 0) AS total
     FROM carbon_activities WHERE status = 'APPROVED'`
    );
    const [[projTotals]] = await db.execute(
        `SELECT COUNT(*) AS count, COALESCE(SUM(estimated_credits), 0) AS total
     FROM ngo_projects WHERE status = 'APPROVED'`
    );

    return {
        summary: {
            farmer_credits_total: parseFloat(actTotals.total),
            ngo_credits_total: parseFloat(projTotals.total),
            grand_total: parseFloat(actTotals.total) + parseFloat(projTotals.total),
        },
        farmer_activity_credits: activityCredits,
        ngo_project_credits: projectCredits,
    };
};

// ─── Marketplace Report ───────────────────────────────────────
exports.getMarketplaceReport = async ({ from, to } = {}) => {
    const dateFilter = from && to
        ? `AND o.created_at BETWEEN ? AND ?` : from
            ? `AND o.created_at >= ?` : to
                ? `AND o.created_at <= ?` : "";
    const dateParams = [from, to].filter(Boolean);

    const [[sales]] = await db.execute(
        `SELECT
       COUNT(*)                            AS total_orders,
       COALESCE(SUM(credits_purchased), 0) AS total_credits_sold,
       COALESCE(SUM(total_amount), 0)      AS gross_revenue,
       COALESCE(SUM(commission_deducted), 0) AS total_commission,
       COALESCE(SUM(seller_payout), 0)     AS total_seller_payouts
     FROM orders o
     WHERE status = 'COMPLETED' ${dateFilter}`,
        dateParams
    );

    const [[escrow]] = await db.execute(
        `SELECT
       COUNT(*)                        AS escrow_count,
       COALESCE(SUM(escrow_amount), 0) AS escrow_held
     FROM orders
     WHERE status IN ('ESCROW', 'CONFIRMED')`
    );

    const [byMonth] = await db.execute(
        `SELECT
       DATE_FORMAT(created_at, '%Y-%m') AS month,
       COUNT(*)                         AS orders,
       SUM(credits_purchased)           AS credits_sold,
       SUM(total_amount)                AS revenue,
       SUM(commission_deducted)         AS commission
     FROM orders
     WHERE status = 'COMPLETED'
     GROUP BY month
     ORDER BY month ASC`
    );

    return {
        summary: {
            total_orders: parseInt(sales.total_orders),
            total_credits_sold: parseFloat(sales.total_credits_sold),
            gross_revenue: parseFloat(sales.gross_revenue),
            total_commission: parseFloat(sales.total_commission),
            total_seller_payouts: parseFloat(sales.total_seller_payouts),
            escrow_orders_pending: parseInt(escrow.escrow_count),
            escrow_amount_held: parseFloat(escrow.escrow_held),
        },
        monthly_breakdown: byMonth,
    };
};

// ─── User Stats Report ────────────────────────────────────────
exports.getUserStats = async () => {
    const [byRole] = await db.execute(
        `SELECT role, status, COUNT(*) AS count
     FROM users
     GROUP BY role, status
     ORDER BY role, status`
    );

    const [[totals]] = await db.execute(
        `SELECT COUNT(*) AS total_users,
            SUM(status = 'ACTIVE')    AS active,
            SUM(status = 'PENDING')   AS pending,
            SUM(status = 'SUSPENDED') AS suspended
     FROM users`
    );

    const [recentSignups] = await db.execute(
        `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS signups
     FROM users
     GROUP BY month
     ORDER BY month DESC
     LIMIT 6`
    );

    return {
        totals: {
            total_users: parseInt(totals.total_users),
            active: parseInt(totals.active),
            pending: parseInt(totals.pending),
            suspended: parseInt(totals.suspended),
        },
        by_role_and_status: byRole,
        recent_signups: recentSignups,
    };
};

// ─── Commission Summary ───────────────────────────────────────
exports.getCommissionSummary = async () => {
    const [[summary]] = await db.execute(
        `SELECT
       COUNT(*)                              AS total_completed_orders,
       COALESCE(SUM(total_amount), 0)        AS gross_revenue,
       COALESCE(SUM(commission_deducted), 0) AS total_commission_earned,
       COALESCE(SUM(seller_payout), 0)       AS total_paid_to_sellers
     FROM orders
     WHERE status = 'COMPLETED'`
    );

    const [byMonth] = await db.execute(
        `SELECT
       DATE_FORMAT(released_at, '%Y-%m')     AS month,
       COUNT(*)                              AS orders_released,
       SUM(commission_deducted)              AS commission,
       SUM(seller_payout)                    AS seller_payouts
     FROM orders
     WHERE status = 'COMPLETED' AND released_at IS NOT NULL
     GROUP BY month
     ORDER BY month DESC
     LIMIT 12`
    );

    return {
        summary: {
            total_completed_orders: parseInt(summary.total_completed_orders),
            gross_revenue: parseFloat(summary.gross_revenue),
            total_commission_earned: parseFloat(summary.total_commission_earned),
            total_paid_to_sellers: parseFloat(summary.total_paid_to_sellers),
            commission_rate: "5%",
        },
        monthly_commission: byMonth,
    };
};

// ─── Compliance Report ────────────────────────────────────────
exports.getComplianceReport = async () => {
    // Credits that were aggregated by more than one project (double-selling risk)
    const [doubleAggregated] = await db.execute(
        `SELECT ca.id, ca.activity_type, ca.estimated_credits,
            COUNT(pf.project_id) AS aggregated_count, u.email AS farmer_email
     FROM carbon_activities ca
     JOIN users u ON u.id = ca.farmer_id
     JOIN project_farmers pf ON pf.activity_id = ca.id
     WHERE ca.status = 'APPROVED'
     GROUP BY ca.id, ca.activity_type, ca.estimated_credits, u.email
     HAVING aggregated_count > 1`
    );

    // Listings with SOLD_OUT status (verify credits were transferred)
    const [[listingStats]] = await db.execute(
        `SELECT
       SUM(status = 'ACTIVE')    AS active_listings,
       SUM(status = 'SOLD_OUT')  AS sold_out_listings,
       SUM(status = 'PENDING')   AS pending_listings,
       SUM(status = 'CANCELLED') AS cancelled_listings,
       SUM(status = 'REJECTED')  AS rejected_listings
     FROM marketplace_listings`
    );

    // Orders with anomalies (ESCROW for more than 7 days)
    const [staleEscrow] = await db.execute(
        `SELECT o.id, o.escrow_amount, o.created_at,
            buyer.email  AS buyer_email,
            seller.email AS seller_email
     FROM orders o
     JOIN users buyer  ON buyer.id  = o.buyer_id
     JOIN users seller ON seller.id = o.seller_id
     WHERE o.status = 'ESCROW'
       AND o.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );

    // Open disputes count
    const [[disputeStats]] = await db.execute(
        `SELECT
       SUM(status = 'OPEN')     AS open_disputes,
       SUM(status = 'RESOLVED') AS resolved_disputes,
       SUM(status = 'CLOSED')   AS closed_disputes
     FROM disputes`
    );

    return {
        listing_health: listingStats,
        stale_escrow_orders: staleEscrow,
        dispute_summary: disputeStats,
        aggregated_activities: {
            total_aggregated: doubleAggregated.length,
            records: doubleAggregated,
        },
    };
};
