const ngoProjectModel = require("../../models/ngoProjectModel");

// ─── Credit estimation ─────────────────────────────────────────
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

// GET /api/admin/ngo/projects/pending
exports.getPendingProjects = async (req, res) => {
    try {
        const projects = await ngoProjectModel.getPendingProjects();
        res.json({ total: projects.length, projects });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch pending projects" });
    }
};

// GET /api/admin/ngo/projects/:id
exports.getProjectById = async (req, res) => {
    try {
        const project = await ngoProjectModel.getProjectById(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found" });
        res.json({ project });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch project" });
    }
};

// PATCH /api/admin/ngo/projects/:id/approve
exports.approveProject = async (req, res) => {
    const { id } = req.params;
    try {
        const project = await ngoProjectModel.getProjectById(id);
        if (!project) return res.status(404).json({ message: "Project not found" });

        if (project.status !== "PENDING")
            return res.status(400).json({ message: `Project is already ${project.status}` });

        // Calculate credits from own project area, plus any aggregated credits
        const ownCredits = estimateCredits(project.project_type, project.area_covered);
        const aggregatedCredits = parseFloat(project.aggregated_credits || 0);
        const totalCredits = parseFloat((ownCredits + aggregatedCredits).toFixed(2));

        await ngoProjectModel.approveProject(id, totalCredits);
        await ngoProjectModel.addCreditsToWallet(project.ngo_id, totalCredits);

        res.json({
            message: "Project approved. Credits issued to NGO wallet.",
            own_credits: ownCredits,
            aggregated_credits: aggregatedCredits,
            total_credits_issued: totalCredits,
            ngo_id: project.ngo_id,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Approval failed" });
    }
};

// PATCH /api/admin/ngo/projects/:id/reject
exports.rejectProject = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    try {
        const project = await ngoProjectModel.getProjectById(id);
        if (!project) return res.status(404).json({ message: "Project not found" });

        await ngoProjectModel.rejectProject(id, reason || "No reason provided");
        res.json({
            message: "Project rejected",
            reason: reason || "No reason provided",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Rejection failed" });
    }
};
