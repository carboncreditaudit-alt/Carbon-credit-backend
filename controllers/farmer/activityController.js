const activityModel = require("../../models/farmer/activityModel");
const path = require("path");

// ─── Helper: Estimate credits based on activity type + area ───
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

// ─── FARMER: Submit new carbon activity ───────────────────────
exports.submitActivity = async (req, res) => {
    const { userId, role } = req.user;

    if (role !== "FARMER")
        return res.status(403).json({ message: "Only farmers can submit activities" });

    const { activity_type, description, area_covered, location } = req.body;

    if (!activity_type || !area_covered || !location)
        return res.status(400).json({ message: "activity_type, area_covered, and location are required" });

    try {
        const activityId = await activityModel.createActivity(userId, req.body);

        res.status(201).json({
            message: "Activity submitted. Pending verification.",
            activityId,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to submit activity" });
    }
};

// ─── FARMER: List own activities ──────────────────────────────
exports.getMyActivities = async (req, res) => {
    const { userId } = req.user;
    try {
        const activities = await activityModel.getActivitiesByFarmer(userId);
        res.json({ total: activities.length, activities });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch activities" });
    }
};

// ─── FARMER / ADMIN: Get single activity ──────────────────────
exports.getActivityById = async (req, res) => {
    const { id } = req.params;
    const { userId, role } = req.user;

    try {
        const activity = await activityModel.getActivityById(id);

        if (!activity)
            return res.status(404).json({ message: "Activity not found" });

        // Farmer can only view their own
        if (role === "FARMER" && activity.farmer_id !== userId)
            return res.status(403).json({ message: "Access denied" });

        res.json({ activity });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch activity" });
    }
};

// ─── FARMER: Upload proof (photo + GPS) ───────────────────────
exports.uploadProof = async (req, res) => {
    const { userId, role } = req.user;
    const { id } = req.params;

    if (role !== "FARMER")
        return res.status(403).json({ message: "Only farmers can upload proof" });

    try {
        const activity = await activityModel.getActivityById(id);

        if (!activity)
            return res.status(404).json({ message: "Activity not found" });

        if (activity.farmer_id !== userId)
            return res.status(403).json({ message: "Access denied" });

        if (!req.file)
            return res.status(400).json({ message: "No image file uploaded" });

        const relativePath = path
            .relative(process.cwd(), req.file.path)
            .replace(/\\/g, "/");

        const { gps } = req.body; // e.g. "28.6139,77.2090"

        await activityModel.updateProof(id, relativePath, gps || null);

        res.json({
            message: "Proof uploaded successfully",
            proof_image_url: relativePath,
            proof_gps: gps || null,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to upload proof" });
    }
};

// ─── FARMER: Get credit estimate ──────────────────────────────
exports.getEstimate = async (req, res) => {
    const { id } = req.params;
    const { userId, role } = req.user;

    try {
        const activity = await activityModel.getEstimate(id);

        if (!activity)
            return res.status(404).json({ message: "Activity not found" });

        if (role === "FARMER" && activity.farmer_id !== userId)
            return res.status(403).json({ message: "Access denied" });

        // Calculate estimate on the fly
        const estimated = estimateCredits(activity.activity_type, activity.area_covered);

        res.json({
            activity_id: activity.id,
            activity_type: activity.activity_type,
            area_covered: activity.area_covered,
            estimated_credits: estimated,
            note: "Actual credits issued after admin verification",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to estimate credits" });
    }
};
