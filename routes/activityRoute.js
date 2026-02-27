const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const activityController = require("../controllers/activityController");

// All routes require authentication
router.use(authMiddleware);

// POST   /api/activities          → Submit new carbon activity (Farmer)
router.post("/", activityController.submitActivity);

// GET    /api/activities          → List own activities (Farmer)
router.get("/", activityController.getMyActivities);

// GET    /api/activities/:id      → Get single activity (Farmer or Admin)
router.get("/:id", activityController.getActivityById);

// POST   /api/activities/:id/proof → Upload photo + GPS proof
router.post(
    "/:id/proof",
    upload.single("proof_image"),
    activityController.uploadProof
);

// GET    /api/activities/:id/estimate → Get credit estimate
router.get("/:id/estimate", activityController.getEstimate);

module.exports = router;
