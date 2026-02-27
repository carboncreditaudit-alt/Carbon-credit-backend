const orderModel = require("../../models/admin/adminModel");

// GET /api/admin/escrow
exports.getEscrowOrders = async (req, res) => {
    try {
        const orders = await orderModel.getEscrowOrders();
        res.json({ total: orders.length, orders });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch escrow orders" });
    }
};

// PATCH /api/admin/escrow/:orderId/release
exports.releaseEscrow = async (req, res) => {
    const { orderId } = req.params;
    try {
        const order = await orderModel.getOrderById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.status !== "CONFIRMED")
            return res.status(400).json({
                message: `Only CONFIRMED orders can be released. Current status: ${order.status}`,
            });

        const { commission, sellerAmount } = await orderModel.releaseEscrow(orderId);

        res.json({
            message: "Escrow released. Payment sent to seller.",
            order_id: parseInt(orderId),
            total_amount: order.total_amount,
            commission_5pct: commission,
            seller_payout: sellerAmount,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Escrow release failed" });
    }
};

// PATCH /api/admin/escrow/:orderId/refund
exports.refundBuyer = async (req, res) => {
    const { orderId } = req.params;
    try {
        const order = await orderModel.getOrderById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (!["ESCROW", "CONFIRMED"].includes(order.status))
            return res.status(400).json({
                message: `Order cannot be refunded — status is ${order.status}`,
            });

        await orderModel.refundBuyer(orderId);

        res.json({
            message: "Order refunded. Buyer will receive full payment.",
            order_id: parseInt(orderId),
            refund_amount: order.total_amount,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Refund failed" });
    }
};
