const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authMiddleware");
const activityController = require("../../controllers/admin/activityController");


router.use(authMiddleware);
router.use((req, res, next) => {
  if (req.user.role !== "ADMIN")
    return res.status(403).json({ message: "Admin only" });
  next();
});


// ─── Carbon Activity Verification ────────────────────────────
router.get("/activities/pending", activityController.getPendingActivities);  // List pending activities
router.get("/activities/:id", activityController.getActivityById);       // View activity detail
router.patch("/activities/:id/approve", activityController.approveActivity);
router.patch("/activities/:id/reject", activityController.rejectActivity);
router.patch("/activities/:id/request-proof", activityController.requestMoreProof);

module.exports = router;