const ngoProjectModel = require("../../models/ngo/ngoProjectModel");
const path = require("path");

// ─── Credit estimation for NGO projects ───────────────────────
const estimateCredits = (projectType, areaCovered) => {
    const ratesPerAcre = {
        REFORESTATION: 6,
        RENEWABLE_ENERGY: 9,
        WETLAND_RESTORATION: 7,
        SOIL_CARBON: 4,
        WASTE_MANAGEMENT: 3,
    };
    const rate = ratesPerAcre[projectType] || 3;
    return parseFloat((areaCovered * rate).toFixed(2));
};

// ─── POST /api/ngo/projects ───────────────────────────────────
exports.submitProject = async (req, res) => {
    const { userId, role } = req.user;

    if (role !== "NGO")
        return res.status(403).json({ message: "Only NGOs can submit projects" });

    const { project_name, project_type, description, location, area_covered } = req.body;

    if (!project_name || !project_type || !location || !area_covered)
        return res.status(400).json({
            message: "project_name, project_type, location, and area_covered are required",
        });

    try {
        const projectId = await ngoProjectModel.createProject(userId, req.body);
        res.status(201).json({
            message: "Project submitted. Pending admin verification.",
            projectId,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to submit project" });
    }
};

// ─── GET /api/ngo/projects ────────────────────────────────────
exports.getMyProjects = async (req, res) => {
    const { userId, role } = req.user;

    if (role !== "NGO")
        return res.status(403).json({ message: "Only NGOs can access this" });

    try {
        const projects = await ngoProjectModel.getProjectsByNgo(userId);
        res.json({ total: projects.length, projects });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch projects" });
    }
};

// ─── GET /api/ngo/projects/:id ───────────────────────────────
exports.getProjectById = async (req, res) => {
    const { userId, role } = req.user;

    try {
        const project = await ngoProjectModel.getProjectById(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found" });

        // NGO can only view their own
        if (role === "NGO" && project.ngo_id !== userId)
            return res.status(403).json({ message: "Access denied" });

        res.json({ project });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch project" });
    }
};

// ─── POST /api/ngo/projects/:id/documents ─────────────────────
exports.uploadDocument = async (req, res) => {
    const { userId, role } = req.user;

    if (role !== "NGO")
        return res.status(403).json({ message: "Only NGOs can upload documents" });

    try {
        const project = await ngoProjectModel.getProjectById(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found" });

        if (project.ngo_id !== userId)
            return res.status(403).json({ message: "Access denied" });

        if (!req.file)
            return res.status(400).json({ message: "No file uploaded" });

        const relativePath = path
            .relative(process.cwd(), req.file.path)
            .replace(/\\/g, "/");

        await ngoProjectModel.saveDocument(req.params.id, relativePath);

        res.json({
            message: "Verification document uploaded successfully",
            file_path: relativePath,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Document upload failed" });
    }
};

// ─── POST /api/ngo/projects/:id/aggregate-farmers ─────────────
exports.aggregateFarmerCredits = async (req, res) => {
    const { userId, role } = req.user;

    if (role !== "NGO")
        return res.status(403).json({ message: "Only NGOs can aggregate credits" });

    const { activity_ids } = req.body; // Array of approved farmer activity IDs

    if (!Array.isArray(activity_ids) || activity_ids.length === 0)
        return res.status(400).json({ message: "activity_ids must be a non-empty array" });

    try {
        const project = await ngoProjectModel.getProjectById(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found" });

        if (project.ngo_id !== userId)
            return res.status(403).json({ message: "Access denied" });

        const results = [];
        let totalAggregated = 0;

        for (const activityId of activity_ids) {
            const activity = await ngoProjectModel.getFarmerActivityForAggregation(activityId);

            if (!activity) {
                results.push({ activity_id: activityId, status: "SKIPPED", reason: "Not found or not approved" });
                continue;
            }

            if (activity.aggregated_by_project) {
                results.push({ activity_id: activityId, status: "SKIPPED", reason: "Already aggregated" });
                continue;
            }

            await ngoProjectModel.markActivityAggregated(activityId, project.id);
            await ngoProjectModel.addAggregatedCredits(project.id, activity.estimated_credits);
            totalAggregated += parseFloat(activity.estimated_credits);

            results.push({ activity_id: activityId, status: "AGGREGATED", credits: activity.estimated_credits });
        }

        res.json({
            message: "Aggregation complete",
            total_credits_aggregated: totalAggregated,
            results,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Aggregation failed" });
    }
};
