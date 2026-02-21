const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");

// Protect all routes
router.use(authMiddleware);

// Only admin access
router.use((req, res, next) => {
  if (req.user.role !== "ADMIN")
    return res.status(403).json({ message: "Admin only" });
  next();
});

router.get("/users/pending", adminController.getPendingUsers);
router.patch("/users/:userId/approve", adminController.approveUser);
router.patch("/users/:userId/reject", adminController.rejectUser);

module.exports = router;