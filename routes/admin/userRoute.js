const express = require("express");
const router = express.Router();
const userController = require("../../controllers/admin/userController");
const authMiddleware = require("../../middleware/authMiddleware");

router.use(authMiddleware);
router.use((req, res, next) => {
  if (req.user.role !== "ADMIN")
    return res.status(403).json({ message: "Admin only" });
  next();
});

// ─── User Verification ────────────────────────────────────────
router.get("/users/pending", userController.getPendingUsers);   // List pending users
router.patch("/users/:userId/approve", userController.approveUser);       // Approve user
router.patch("/users/:userId/reject", userController.rejectUser);        // Reject user (with reason)


// ─── User List & Detail ───────────────────────────────────────
router.get("/users", userController.getAllUsers);        // All users (filter: ?role=&status=)
router.get("/users/:id", userController.getUserById);        // Single user + profile + KYC
router.get("/users/:id/kyc", userController.getUserKyc);         // View a user's KYC document record

// ─── KYC Verification ────────────────────────────────────────
router.get("/kyc/pending", userController.getPendingKyc);     // All pending KYC submissions
router.patch("/kyc/:userId/approve", userController.approveKyc);        // Approve KYC
router.patch("/kyc/:userId/reject", userController.rejectKyc);   

module.exports = router;