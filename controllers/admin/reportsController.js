const reportsModel = require("../../models/admin/reportsModel");

// GET /api/admin/reports/credits-issued
// Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD&group_by=day|month|year
exports.getCreditsIssued = async (req, res) => {
    try {
        const { from, to, group_by } = req.query;
        const report = await reportsModel.getCreditsIssued({ from, to, group_by });
        res.json({ report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to generate credits-issued report" });
    }
};

// GET /api/admin/reports/marketplace
// Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD
exports.getMarketplaceReport = async (req, res) => {
    try {
        const { from, to } = req.query;
        const report = await reportsModel.getMarketplaceReport({ from, to });
        res.json({ report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to generate marketplace report" });
    }
};

// GET /api/admin/reports/users
exports.getUserStats = async (req, res) => {
    try {
        const report = await reportsModel.getUserStats();
        res.json({ report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to generate user stats" });
    }
};

// GET /api/admin/reports/commission
exports.getCommissionSummary = async (req, res) => {
    try {
        const report = await reportsModel.getCommissionSummary();
        res.json({ report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to generate commission summary" });
    }
};

// GET /api/admin/reports/compliance
exports.getComplianceReport = async (req, res) => {
    try {
        const report = await reportsModel.getComplianceReport();
        res.json({ report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to generate compliance report" });
    }
};

// GET /api/admin/reports/dashboard
// Single endpoint aggregating key metrics
exports.getDashboard = async (req, res) => {
    try {
        const [userStats, marketplaceReport, commissionSummary, creditsIssued] =
            await Promise.all([
                reportsModel.getUserStats(),
                reportsModel.getMarketplaceReport(),
                reportsModel.getCommissionSummary(),
                reportsModel.getCreditsIssued(),
            ]);

        res.json({
            dashboard: {
                users: userStats.totals,
                marketplace: marketplaceReport.summary,
                credits: creditsIssued.summary,
                commission: {
                    total_earned: commissionSummary.summary.total_commission_earned,
                    rate: commissionSummary.summary.commission_rate,
                },
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to load dashboard" });
    }
};
