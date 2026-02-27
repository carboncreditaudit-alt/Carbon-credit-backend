const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const retirementController = require("../controllers/retirementController");

// All routes require authentication
router.use(authMiddleware);

// POST  /api/retirement                   → Retire credits (Company only)
router.post("/", retirementController.retireCredits);

// GET   /api/retirement                   → List own retirements
router.get("/", retirementController.getMyRetirements);

// GET   /api/retirement/:id               → Retirement detail
router.get("/:id", retirementController.getRetirementById);

// GET   /api/retirement/:id/certificate   → Retirement certificate data
router.get("/:id/certificate", retirementController.getCertificate);

// GET   /api/retirement/:id/esg-report    → ESG report data
router.get("/:id/esg-report", retirementController.getEsgReport);

module.exports = router;
