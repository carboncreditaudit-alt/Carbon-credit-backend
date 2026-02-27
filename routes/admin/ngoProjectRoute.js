const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authMiddleware");
const ngoProjectController = require("../../controllers/admin/ngoProjectController");


router.use(authMiddleware);
router.use((req, res, next) => {
  if (req.user.role !== "ADMIN")
    return res.status(403).json({ message: "Admin only" });
  next();
});



// ─── NGO Project Verification ────────────────────────────────
router.get("/ngo/projects/pending", ngoProjectController.getPendingProjects);  // All pending NGO projects
router.get("/ngo/projects/:id", ngoProjectController.getProjectById);      // Project detail
router.patch("/ngo/projects/:id/approve", ngoProjectController.approveProject);      // Approve → issue credits
router.patch("/ngo/projects/:id/reject", ngoProjectController.rejectProject);       // Reject with reason

module.exports = router;