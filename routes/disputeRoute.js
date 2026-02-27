const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const disputeController = require("../controllers/disputeController");

// All dispute routes require auth
router.use(authMiddleware);

// POST   /api/disputes          → Raise a dispute
router.post("/", disputeController.raiseDispute);

// GET    /api/disputes          → List own disputes
router.get("/", disputeController.getMyDisputes);

// GET    /api/disputes/:id      → Dispute detail
router.get("/:id", disputeController.getDisputeById);

module.exports = router;
