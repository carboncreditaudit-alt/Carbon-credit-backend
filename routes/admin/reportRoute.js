const express = require("express");
const router = express.Router();
const reportsController = require("../../controllers/admin/reportsController");
const authMiddleware = require("../../middleware/authMiddleware");

// ─── Protect ALL admin routes ─────────────────────────────────
router.use(authMiddleware);
router.use((req, res, next) => {
  if (req.user.role !== "ADMIN")
    return res.status(403).json({ message: "Admin only" });
  next();
});

// ─── Reports & Analytics (Admin) ──────────────────────────────
router.get("/reports/dashboard", reportsController.getDashboard);
router.get("/reports/credits-issued", reportsController.getCreditsIssued);
router.get("/reports/marketplace", reportsController.getMarketplaceReport);
router.get("/reports/users", reportsController.getUserStats);
router.get("/reports/commission", reportsController.getCommissionSummary);
router.get("/reports/compliance", reportsController.getComplianceReport);

module.exports = router;