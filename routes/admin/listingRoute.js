const express = require("express");
const router = express.Router();
const listingAdminController = require("../../controllers/admin/MarketListingController");
const authMiddleware = require("../../middleware/authMiddleware");

// ─── Protect ALL admin routes ─────────────────────────────────
router.use(authMiddleware);
router.use((req, res, next) => {
  if (req.user.role !== "ADMIN")
    return res.status(403).json({ message: "Admin only" });
  next();
});


//─── Marketplace Listings (Admin) ─────────────────────────────
router.get("/listings/pending", listingAdminController.getPendingListings); // Listings awaiting approval
router.patch("/listings/:id/approve", listingAdminController.approveListing);     // Approve listing
router.patch("/listings/:id/reject", listingAdminController.rejectListing);      // Reject listing 


module.exports = router;
