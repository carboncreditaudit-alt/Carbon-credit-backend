const disputeModel = require("../models/disputeModel");

// ─── POST /api/disputes ───────────────────────────────────────
exports.raiseDispute = async (req, res) => {
    const { userId } = req.user;
    const { order_id, dispute_type, description } = req.body;

    if (!dispute_type || !description)
        return res.status(400).json({ message: "dispute_type and description are required" });

    const validTypes = ["PAYMENT", "CREDIT_TRANSFER", "FRAUD", "QUALITY", "OTHER"];
    if (!validTypes.includes(dispute_type))
        return res.status(400).json({
            message: `dispute_type must be one of: ${validTypes.join(", ")}`,
        });

    try {
        const disputeId = await disputeModel.createDispute(userId, req.body);
        res.status(201).json({
            message: "Dispute raised successfully. Our team will review it shortly.",
            disputeId,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to raise dispute" });
    }
};

// ─── GET /api/disputes ────────────────────────────────────────
exports.getMyDisputes = async (req, res) => {
    const { userId } = req.user;
    try {
        const disputes = await disputeModel.getDisputesByUser(userId);
        res.json({ total: disputes.length, disputes });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch disputes" });
    }
};

// ─── GET /api/disputes/:id ────────────────────────────────────
exports.getDisputeById = async (req, res) => {
    const { userId, role } = req.user;
    try {
        const dispute = await disputeModel.getDisputeById(req.params.id);
        if (!dispute) return res.status(404).json({ message: "Dispute not found" });

        // Only the raiser or admin can view
        if (role !== "ADMIN" && dispute.raised_by !== userId)
            return res.status(403).json({ message: "Access denied" });

        res.json({ dispute });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch dispute" });
    }
};

// ─── GET /api/admin/disputes ──────────────────────────────────
exports.getAllDisputes = async (req, res) => {
    const { status } = req.query; // ?status=OPEN|RESOLVED|CLOSED
    try {
        const disputes = await disputeModel.getAllDisputes(status);
        res.json({ total: disputes.length, disputes });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch disputes" });
    }
};

// ─── PATCH /api/admin/disputes/:id/resolve ────────────────────
exports.resolveDispute = async (req, res) => {
    const { userId } = req.user;
    const { resolution, decision } = req.body;

    if (!resolution)
        return res.status(400).json({ message: "resolution text is required" });

    try {
        const dispute = await disputeModel.getDisputeById(req.params.id);
        if (!dispute) return res.status(404).json({ message: "Dispute not found" });

        if (dispute.status === "RESOLVED")
            return res.status(400).json({ message: "Dispute is already resolved" });

        await disputeModel.resolveDispute(req.params.id, userId, resolution, decision || null);

        res.json({
            message: "Dispute resolved successfully",
            resolution,
            decision: decision || null,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to resolve dispute" });
    }
};

// ─── PATCH /api/admin/disputes/:id/close ─────────────────────
exports.closeDispute = async (req, res) => {
    const { userId } = req.user;
    const { note } = req.body;

    try {
        const dispute = await disputeModel.getDisputeById(req.params.id);
        if (!dispute) return res.status(404).json({ message: "Dispute not found" });

        if (dispute.status === "CLOSED")
            return res.status(400).json({ message: "Dispute is already closed" });

        await disputeModel.closeDispute(req.params.id, userId, note);
        res.json({ message: "Dispute closed", note: note || "Closed by admin" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to close dispute" });
    }
};
