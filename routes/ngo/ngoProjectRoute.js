const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authMiddleware");
const upload = require("../../middleware/uploadMiddleware");
const ngoProjectController = require("../../controllers/ngo/ngoProjectController");

// All routes require authentication
router.use(authMiddleware);

// POST   /api/ngo/projects                        → Submit new project
router.post("/", ngoProjectController.submitProject);

// GET    /api/ngo/projects                        → List own projects
router.get("/", ngoProjectController.getMyProjects);

// GET    /api/ngo/projects/:id                    → Get project detail
router.get("/:id", ngoProjectController.getProjectById);

// POST   /api/ngo/projects/:id/documents          → Upload verification doc
router.post(
    "/:id/documents",
    upload.single("verification_doc"),
    ngoProjectController.uploadDocument
);

// POST   /api/ngo/projects/:id/aggregate-farmers  → Aggregate farmer credits
router.post("/:id/aggregate-farmers", ngoProjectController.aggregateFarmerCredits);

module.exports = router;
