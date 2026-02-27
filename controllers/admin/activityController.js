const activityModel = require("../../models/farmer/activityModel");

// Helper: credit rate per acre
const estimateCredits = (activityType, areaCovered) => {
    const ratesPerAcre = {
        TREE_PLANTATION: 5,
        ORGANIC_FARMING: 3,
        SOLAR_ADOPTION: 8,
        WATER_CONSERVATION: 4,
        CROP_RESIDUE_MGMT: 2,
    };
    const rate = ratesPerAcre[activityType] || 2;
    return parseFloat((areaCovered * rate).toFixed(2));
};

// GET /api/admin/activities/pending
exports.getPendingActivities = async (req, res) => {
    try {
        const activities = await activityModel.getPendingActivities();
        res.json({ total: activities.length, activities });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch pending activities" });
    }
};

// GET /api/admin/activities/:id
exports.getActivityById = async (req, res) => {
    try {
        const activity = await activityModel.getActivityById(req.params.id);
        if (!activity) return res.status(404).json({ message: "Activity not found" });
        res.json({ activity });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch activity" });
    }
};

// PATCH /api/admin/activities/:id/approve
exports.approveActivity = async (req, res) => {
    const { id } = req.params;

    try {
        const activity = await activityModel.getActivityById(id);
        if (!activity) return res.status(404).json({ message: "Activity not found" });

        if (activity.status !== "PENDING" && activity.status !== "PROOF_REQUESTED")
            return res.status(400).json({ message: `Activity is already ${activity.status}` });

        // Calculate credits
        const credits = estimateCredits(activity.activity_type, activity.area_covered);

        // Approve and write credits
        await activityModel.approveActivity(id, credits);

        // Credit farmer wallet
        await activityModel.addCreditsToWallet(activity.farmer_id, credits);

        res.json({
            message: "Activity approved. Credits issued.",
            credits_issued: credits,
            farmer_id: activity.farmer_id,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Approval failed" });
    }
};

// PATCH /api/admin/activities/:id/reject
exports.rejectActivity = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    try {
        const activity = await activityModel.getActivityById(id);
        if (!activity) return res.status(404).json({ message: "Activity not found" });

        await activityModel.rejectActivity(id, reason || "No reason provided");
        res.json({ message: "Activity rejected", reason: reason || "No reason provided" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Rejection failed" });
    }
};

// PATCH /api/admin/activities/:id/request-proof
exports.requestMoreProof = async (req, res) => {
    const { id } = req.params;
    const { note } = req.body;

    try {
        const activity = await activityModel.getActivityById(id);
        if (!activity) return res.status(404).json({ message: "Activity not found" });

        await activityModel.requestMoreProof(id, note || "Please provide additional evidence");
        res.json({ message: "Additional proof requested", note: note || "Please provide additional evidence" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to request proof" });
    }
};
