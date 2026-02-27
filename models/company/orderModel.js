const db = require("../../config/db");

// ─── Create order (escrow hold) ───────────────────────────────
exports.createOrder = async (buyerId, data) => {
    const { listing_id, quantity } = data;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Fetch listing
        const [listings] = await conn.execute(
            `SELECT id, seller_id, credit_type, quantity_available, price_per_credit, status
       FROM marketplace_listings WHERE id = ? FOR UPDATE`,
            [listing_id]
        );
        const listing = listings[0];
        if (!listing) throw new Error("LISTING_NOT_FOUND");
        if (listing.status !== "ACTIVE") throw new Error("LISTING_NOT_ACTIVE");
        if (listing.quantity_available < quantity) throw new Error("INSUFFICIENT_CREDITS");

        const totalAmount = parseFloat((listing.price_per_credit * quantity).toFixed(2));

        // 2. Deduct quantity_available from listing
        await conn.execute(
            `UPDATE marketplace_listings
       SET quantity_available = quantity_available - ?
       WHERE id = ?`,
            [quantity, listing_id]
        );

        // 3. Mark as SOLD_OUT if no credits left
        await conn.execute(
            `UPDATE marketplace_listings
       SET status = IF(quantity_available = 0, 'SOLD_OUT', status)
       WHERE id = ?`,
            [listing_id]
        );

        // 4. Create the order in escrow
        const [result] = await conn.execute(
            `INSERT INTO orders
         (buyer_id, seller_id, listing_id, credit_type, credits_purchased,
          total_amount, escrow_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ESCROW')`,
            [
                buyerId,
                listing.seller_id,
                listing_id,
                listing.credit_type,
                quantity,
                totalAmount,
                totalAmount,
            ]
        );

        await conn.commit();
        return { orderId: result.insertId, totalAmount };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// ─── Get own orders (buyer or seller) ────────────────────────
exports.getOrdersByUser = async (userId) => {
    const [rows] = await db.execute(
        `SELECT o.id, o.credit_type, o.credits_purchased, o.total_amount,
            o.status, o.created_at,
            buyer.email  AS buyer_email,
            seller.email AS seller_email
     FROM orders o
     JOIN users buyer  ON buyer.id  = o.buyer_id
     JOIN users seller ON seller.id = o.seller_id
     WHERE o.buyer_id = ? OR o.seller_id = ?
     ORDER BY o.created_at DESC`,
        [userId, userId]
    );
    return rows;
};

// ─── Get order by ID ──────────────────────────────────────────
exports.getOrderById = async (orderId) => {
    const [rows] = await db.execute(
        `SELECT o.*,
            buyer.email  AS buyer_email,
            seller.email AS seller_email
     FROM orders o
     JOIN users buyer  ON buyer.id  = o.buyer_id
     JOIN users seller ON seller.id = o.seller_id
     WHERE o.id = ?`,
        [orderId]
    );
    return rows[0];
};

// ─── Confirm order (platform) → transfer credits ──────────────
exports.confirmOrder = async (orderId, buyerId, sellerId, quantity, creditType) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Update order status
        await conn.execute(
            `UPDATE orders SET status = 'CONFIRMED' WHERE id = ?`,
            [orderId]
        );

        // Add credits to buyer wallet
        await conn.execute(
            `UPDATE credit_wallets
       SET balance = balance + ?
       WHERE user_id = ?`,
            [quantity, buyerId]
        );

        // Deduct credits from seller wallet
        await conn.execute(
            `UPDATE credit_wallets
       SET balance = balance - ?
       WHERE user_id = ?`,
            [quantity, sellerId]
        );

        // Record user_credits entry for buyer
        await conn.execute(
            `INSERT INTO user_credits
         (owner_id, credit_type, quantity, source_type, source_id, status)
       VALUES (?, ?, ?, 'ACTIVITY', ?, 'ACTIVE')`,
            [buyerId, creditType, quantity, orderId]
        );

        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// ─── Cancel order → restore listing quantity ──────────────────
exports.cancelOrder = async (orderId) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [rows] = await conn.execute(
            `SELECT listing_id, credits_purchased FROM orders WHERE id = ?`,
            [orderId]
        );
        const order = rows[0];

        // Restore listing availability
        await conn.execute(
            `UPDATE marketplace_listings
       SET quantity_available = quantity_available + ?, status = 'ACTIVE'
       WHERE id = ?`,
            [order.credits_purchased, order.listing_id]
        );

        // Mark order as CANCELLED
        await conn.execute(
            `UPDATE orders SET status = 'CANCELLED' WHERE id = ?`,
            [orderId]
        );

        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// ─── ADMIN: List all escrow-held orders ───────────────────────
exports.getEscrowOrders = async () => {
    const [rows] = await db.execute(
        `SELECT o.id, o.credit_type, o.credits_purchased,
            o.total_amount, o.escrow_amount, o.status, o.created_at,
            buyer.email  AS buyer_email,
            seller.email AS seller_email
     FROM orders o
     JOIN users buyer  ON buyer.id  = o.buyer_id
     JOIN users seller ON seller.id = o.seller_id
     WHERE o.status IN ('ESCROW', 'CONFIRMED')
     ORDER BY o.created_at ASC`
    );
    return rows;
};

// ─── ADMIN: Release payment to seller (deduct commission) ─────
const COMMISSION_RATE = 0.05; // 5% platform commission

exports.releaseEscrow = async (orderId) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [rows] = await conn.execute(
            `SELECT id, seller_id, total_amount, escrow_amount FROM orders WHERE id = ?`,
            [orderId]
        );
        const order = rows[0];
        const commission = parseFloat((order.total_amount * COMMISSION_RATE).toFixed(2));
        const sellerAmount = parseFloat((order.total_amount - commission).toFixed(2));

        // Mark order completed
        await conn.execute(
            `UPDATE orders
       SET status = 'COMPLETED',
           commission_deducted = ?,
           seller_payout = ?,
           escrow_amount = 0,
           released_at = NOW()
       WHERE id = ?`,
            [commission, sellerAmount, orderId]
        );

        await conn.commit();
        return { commission, sellerAmount };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// ─── ADMIN: Refund buyer ──────────────────────────────────────
exports.refundBuyer = async (orderId) => {
    await db.execute(
        `UPDATE orders
     SET status = 'REFUNDED', escrow_amount = 0, released_at = NOW()
     WHERE id = ?`,
        [orderId]
    );
};
