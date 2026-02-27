const retirementModel = require("../models/retirementModel");

// ─── POST /api/retirement ─────────────────────────────────────
exports.retireCredits = async (req, res) => {
    const { userId, role } = req.user;

    if (role !== "COMPANY")
        return res.status(403).json({ message: "Only companies can retire credits" });

    const { credits_to_retire, retirement_purpose, project_name, reporting_year } = req.body;

    if (!credits_to_retire || !retirement_purpose)
        return res.status(400).json({ message: "credits_to_retire and retirement_purpose are required" });

    if (credits_to_retire <= 0)
        return res.status(400).json({ message: "credits_to_retire must be greater than 0" });

    try {
        const { retirementId, certificateNumber } = await retirementModel.retireCredits(userId, req.body);

        res.status(201).json({
            message: "Credits retired successfully.",
            retirementId,
            certificate_number: certificateNumber,
        });
    } catch (err) {
        console.error(err);
        if (err.message === "INSUFFICIENT_BALANCE")
            return res.status(400).json({ message: "Insufficient credit balance to retire" });
        res.status(500).json({ message: "Retirement failed" });
    }
};

// ─── GET /api/retirement ──────────────────────────────────────
exports.getMyRetirements = async (req, res) => {
    const { userId } = req.user;
    try {
        const retirements = await retirementModel.getRetirementsByUser(userId);
        res.json({ total: retirements.length, retirements });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch retirements" });
    }
};

// ─── GET /api/retirement/:id ──────────────────────────────────
exports.getRetirementById = async (req, res) => {
    const { userId, role } = req.user;
    try {
        const retirement = await retirementModel.getRetirementById(req.params.id);
        if (!retirement) return res.status(404).json({ message: "Retirement record not found" });

        if (role !== "ADMIN" && retirement.user_id !== userId)
            return res.status(403).json({ message: "Access denied" });

        res.json({ retirement });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch retirement" });
    }
};

// ─── GET /api/retirement/:id/certificate ─────────────────────
exports.getCertificate = async (req, res) => {
    const { userId, role } = req.user;
    try {
        const retirement = await retirementModel.getRetirementById(req.params.id);
        if (!retirement) return res.status(404).json({ message: "Retirement record not found" });

        if (role !== "ADMIN" && retirement.user_id !== userId)
            return res.status(403).json({ message: "Access denied" });

        const company = await retirementModel.getCompanyProfile(retirement.user_id);

        // Build certificate data (can be rendered to PDF by frontend)
        const certificate = {
            title: "Carbon Credit Retirement Certificate",
            certificate_number: retirement.certificate_number,
            issued_to: company?.company_name || retirement.email,
            issued_by: "Carbon Credit Marketplace Platform",
            credits_retired: retirement.credits_retired,
            retirement_purpose: retirement.retirement_purpose,
            project_name: retirement.project_name || "N/A",
            reporting_year: retirement.reporting_year,
            retirement_date: retirement.created_at,
            verified: true,
            verification_statement:
                `This certifies that ${company?.company_name || retirement.email} has permanently retired ` +
                `${retirement.credits_retired} carbon credits on ${new Date(retirement.created_at).toDateString()} ` +
                `for the purpose of: ${retirement.retirement_purpose}.`,
        };

        res.json({ certificate });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to generate certificate" });
    }
};

// ─── GET /api/retirement/:id/esg-report ──────────────────────
exports.getEsgReport = async (req, res) => {
    const { userId, role } = req.user;
    try {
        const retirement = await retirementModel.getRetirementById(req.params.id);
        if (!retirement) return res.status(404).json({ message: "Retirement record not found" });

        if (role !== "ADMIN" && retirement.user_id !== userId)
            return res.status(403).json({ message: "Access denied" });

        const company = await retirementModel.getCompanyProfile(retirement.user_id);

        const esgReport = {
            report_title: "ESG Carbon Offset Report",
            company_name: company?.company_name || retirement.email,
            reporting_year: retirement.reporting_year,
            certificate_number: retirement.certificate_number,
            carbon_offset: {
                credits_retired: retirement.credits_retired,
                equivalent_co2_tons: parseFloat((retirement.credits_retired * 0.9).toFixed(2)),
                retirement_purpose: retirement.retirement_purpose,
                retirement_date: retirement.created_at,
            },
            sdg_alignment: [
                "SDG 13 — Climate Action",
                "SDG 15 — Life on Land",
            ],
            compliance_note:
                "This offset has been permanently retired on the Carbon Credit Marketplace blockchain ledger and cannot be reused.",
            generated_at: new Date().toISOString(),
        };

        res.json({ esg_report: esgReport });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to generate ESG report" });
    }
};
