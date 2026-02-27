const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const listingController = require("../controllers/listingController");

// ─── Public browse (no auth required for viewing) ─────────────
// GET  /api/listings                → Browse with optional filters
// GET  /api/listings/:id            → Listing detail
router.get("/", listingController.getListings);
router.get("/:id", listingController.getListingById);

// ─── Protected routes (require JWT) ───────────────────────────
router.use(authMiddleware);

// POST   /api/listings              → Create listing (Farmer / NGO)
router.post("/", listingController.createListing);

// PUT    /api/listings/:id          → Update listing (owner only)
router.put("/:id", listingController.updateListing);

// DELETE /api/listings/:id          → Cancel listing (owner only)
router.delete("/:id", listingController.cancelListing);

module.exports = router;
