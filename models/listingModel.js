const db = require("../config/db");

// ─── Create a listing ─────────────────────────────────────────
exports.createListing = async (sellerId, data) => {
    const { credit_type, quantity, price_per_credit, location, description } = data;
    const [result] = await db.execute(
        `INSERT INTO marketplace_listings
       (seller_id, credit_type, quantity_available,
        price_per_credit, location, description, status)
     VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
        [
            sellerId,
            credit_type,
            quantity,
            price_per_credit || 0,
            location,
            description || null,
        ]
    );
    return result.insertId;
};

// ─── Browse all ACTIVE listings (public / company) ────────────
exports.getActiveListings = async (filters = {}) => {
    let query = `
    SELECT l.id, l.credit_type, l.quantity_available, l.price_per_credit,
           l.location, l.status, l.created_at,
           u.role AS seller_role,
           u.id   AS seller_id
    FROM marketplace_listings l
    JOIN users u ON u.id = l.seller_id
    WHERE l.status = 'ACTIVE'
  `;
    const params = [];

    if (filters.credit_type) {
        query += ` AND l.credit_type = ?`;
        params.push(filters.credit_type);
    }
    if (filters.location) {
        query += ` AND l.location LIKE ?`;
        params.push(`%${filters.location}%`);
    }
    if (filters.min_price) {
        query += ` AND l.price_per_credit >= ?`;
        params.push(filters.min_price);
    }
    if (filters.max_price) {
        query += ` AND l.price_per_credit <= ?`;
        params.push(filters.max_price);
    }
    if (filters.seller_role) {
        query += ` AND u.role = ?`;
        params.push(filters.seller_role);
    }

    query += ` ORDER BY l.created_at DESC`;

    const [rows] = await db.execute(query, params);
    return rows;
};

// ─── Get listing by ID ────────────────────────────────────────
exports.getListingById = async (listingId) => {
    const [rows] = await db.execute(
        `SELECT l.*, u.email AS seller_email, u.role AS seller_role
     FROM marketplace_listings l
     JOIN users u ON u.id = l.seller_id
     WHERE l.id = ?`,
        [listingId]
    );
    return rows[0];
};

// ─── Update listing (price / quantity) ───────────────────────
exports.updateListing = async (listingId, data) => {
    const { price_per_credit, quantity_available, description } = data;
    await db.execute(
        `UPDATE marketplace_listings
     SET price_per_credit = ?, quantity_available = ?, description = ?
     WHERE id = ?`,
        [price_per_credit, quantity_available, description, listingId]
    );
};

// ─── Cancel / remove listing ──────────────────────────────────
exports.cancelListing = async (listingId) => {
    await db.execute(
        `UPDATE marketplace_listings SET status = 'CANCELLED' WHERE id = ?`,
        [listingId]
    );
};

// ─── ADMIN: Get pending listings ──────────────────────────────
exports.getPendingListings = async () => {
    const [rows] = await db.execute(
        `SELECT l.id, l.credit_type, l.quantity_available, l.price_per_credit,
            l.location, l.status, l.created_at,
            u.email AS seller_email, u.role AS seller_role
     FROM marketplace_listings l
     JOIN users u ON u.id = l.seller_id
     WHERE l.status = 'PENDING'
     ORDER BY l.created_at ASC`
    );
    return rows;
};

// ─── ADMIN: Approve listing ───────────────────────────────────
exports.approveListing = async (listingId) => {
    await db.execute(
        `UPDATE marketplace_listings
     SET status = 'ACTIVE'
     WHERE id = ?`,
        [listingId]
    );
};

// ─── ADMIN: Reject listing ────────────────────────────────────
exports.rejectListing = async (listingId, reason) => {
    await db.execute(
        `UPDATE marketplace_listings
     SET status = 'CANCELLED'
     WHERE id = ?`,
        [listingId]
    );
};
