const orderModel = require("../../models/orderModel");

// ─── POST /api/orders ─────────────────────────────────────────
exports.createOrder = async (req, res) => {
    const { userId, role } = req.user;

    if (role !== "COMPANY")
        return res.status(403).json({ message: "Only companies can purchase credits" });

    const { listing_id, quantity } = req.body;
    if (!listing_id || !quantity)
        return res.status(400).json({ message: "listing_id and quantity are required" });

    if (quantity <= 0)
        return res.status(400).json({ message: "quantity must be greater than 0" });

    try {
        const { orderId, totalAmount } = await orderModel.createOrder(userId, req.body);
        res.status(201).json({
            message: "Order placed. Payment held in escrow. Awaiting platform confirmation.",
            orderId,
            total_amount: totalAmount,
        });
    } catch (err) {
        console.error(err);
        const msgMap = {
            LISTING_NOT_FOUND: [404, "Listing not found"],
            LISTING_NOT_ACTIVE: [400, "Listing is not active"],
            INSUFFICIENT_CREDITS: [400, "Not enough credits available in this listing"],
        };
        const [status, message] = msgMap[err.message] || [500, "Failed to place order"];
        res.status(status).json({ message });
    }
};

// ─── GET /api/orders ──────────────────────────────────────────
exports.getMyOrders = async (req, res) => {
    const { userId } = req.user;
    try {
        const orders = await orderModel.getOrdersByUser(userId);
        res.json({ total: orders.length, orders });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch orders" });
    }
};

// ─── GET /api/orders/:id ──────────────────────────────────────
exports.getOrderById = async (req, res) => {
    const { userId, role } = req.user;
    try {
        const order = await orderModel.getOrderById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        // Only buyer, seller or admin can view
        if (role !== "ADMIN" && order.buyer_id !== userId && order.seller_id !== userId)
            return res.status(403).json({ message: "Access denied" });

        res.json({ order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch order" });
    }
};

// ─── PUT /api/orders/:id/confirm ─────────────────────────────
exports.confirmOrder = async (req, res) => {
    const { userId, role } = req.user;
    try {
        const order = await orderModel.getOrderById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        // Only buyer or admin can confirm
        if (role !== "ADMIN" && order.buyer_id !== userId)
            return res.status(403).json({ message: "Access denied" });

        if (order.status !== "ESCROW")
            return res.status(400).json({ message: `Order cannot be confirmed — status is ${order.status}` });

        await orderModel.confirmOrder(
            order.id,
            order.buyer_id,
            order.seller_id,
            order.credits_purchased,
            order.credit_type
        );

        res.json({
            message: "Order confirmed. Credits transferred to buyer wallet.",
            credits_transferred: order.credits_purchased,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Confirmation failed" });
    }
};

// ─── PUT /api/orders/:id/cancel ──────────────────────────────
exports.cancelOrder = async (req, res) => {
    const { userId, role } = req.user;
    try {
        const order = await orderModel.getOrderById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (role !== "ADMIN" && order.buyer_id !== userId)
            return res.status(403).json({ message: "Access denied" });

        if (!["ESCROW", "CONFIRMED"].includes(order.status))
            return res.status(400).json({ message: `Order cannot be cancelled — status is ${order.status}` });

        await orderModel.cancelOrder(order.id);
        res.json({ message: "Order cancelled. Escrow released. Listing quantity restored." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Cancellation failed" });
    }
};
