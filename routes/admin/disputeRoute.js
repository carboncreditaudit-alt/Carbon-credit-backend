const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authMiddleware");
const disputeController = require("../../controllers/disputeController");

// ─── Protect ALL admin routes ─────────────────────────────────
router.use(authMiddleware);
router.use((req, res, next) => {
  if (req.user.role !== "ADMIN")
    return res.status(403).json({ message: "Admin only" });
  next();
});


// ─── Disputes (Admin) ─────────────────────────────────────────
router.get("/disputes", disputeController.getAllDisputes);     // All disputes (?status=OPEN|RESOLVED|CLOSED)
router.patch("/disputes/:id/resolve", disputeController.resolveDispute);    // Resolve with decision
router.patch("/disputes/:id/close", disputeController.closeDispute);      // Close dispute

module.exports = router;