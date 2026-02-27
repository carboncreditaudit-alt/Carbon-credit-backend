const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authMiddleware");
const escrowController = require("../../controllers/admin/escrowController");

// ─── Protect ALL admin routes ─────────────────────────────────
router.use(authMiddleware);
router.use((req, res, next) => {
  if (req.user.role !== "ADMIN")
    return res.status(403).json({ message: "Admin only" });
  next();
});


// ─── Purchases & Escrow (Admin) ───────────────────────────────
router.get("/escrow", escrowController.getEscrowOrders);    // All escrow-held orders
router.patch("/escrow/:orderId/release", escrowController.releaseEscrow);      // Release → seller paid
router.patch("/escrow/:orderId/refund", escrowController.refundBuyer);        // Refund buyer

module.exports = router;