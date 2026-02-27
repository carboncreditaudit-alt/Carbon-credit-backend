const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authMiddleware");
const walletController = require("../../controllers/walletController");


router.use(authMiddleware);
router.use((req, res, next) => {
  if (req.user.role !== "ADMIN")
    return res.status(403).json({ message: "Admin only" });
  next();
});


// ─── Wallet & Credits (Admin) ──────────────────────────────
router.get("/wallet/:userId", walletController.getAdminWallet); // View any user's wallet

module.exports = router;