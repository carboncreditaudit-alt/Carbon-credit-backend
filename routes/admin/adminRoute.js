const express = require("express");
const router = express.Router();
const adminController = require("../../controllers/admin/adminController");
const activityAdminController = require("../../controllers/admin/activityAdminController");
const ngoProjectAdminController = require("../../controllers/admin/ngoProjectAdminController");
const walletController = require("../../controllers/walletController");
const listingAdminController = require("../../controllers/admin/listingAdminController");
const escrowAdminController = require("../../controllers/admin/escrowAdminController");
const disputeController = require("../../controllers/disputeController");
const reportsController = require("../../controllers/admin/reportsController");
const retirementModel = require("../../models/retirementModel");
const authMiddleware = require("../../middleware/authMiddleware");
// ─── Protect ALL admin routes ─────────────────────────────────
router.use(authMiddleware);
router.use((req, res, next) => {
  if (req.user.role !== "ADMIN")
    return res.status(403).json({ message: "Admin only" });
  next();
});

// ─── User Verification ────────────────────────────────────────
router.get("/users/pending", adminController.getPendingUsers);   // List pending users
router.patch("/users/:userId/approve", adminController.approveUser);       // Approve user
router.patch("/users/:userId/reject", adminController.rejectUser);        // Reject user (with reason)

// ─── User List & Detail ───────────────────────────────────────
router.get("/users", adminController.getAllUsers);        // All users (filter: ?role=&status=)
router.get("/users/:id", adminController.getUserById);        // Single user + profile + KYC
router.get("/users/:id/kyc", adminController.getUserKyc);         // View a user's KYC document record

// ─── KYC Verification ────────────────────────────────────────
router.get("/kyc/pending", adminController.getPendingKyc);     // All pending KYC submissions
router.patch("/kyc/:userId/approve", adminController.approveKyc);        // Approve KYC
router.patch("/kyc/:userId/reject", adminController.rejectKyc);         // Reject KYC

// ─── Carbon Activity Verification ────────────────────────────
router.get("/activities/pending", activityAdminController.getPendingActivities);  // List pending activities
router.get("/activities/:id", activityAdminController.getActivityById);       // View activity detail
router.patch("/activities/:id/approve", activityAdminController.approveActivity);
router.patch("/activities/:id/reject", activityAdminController.rejectActivity);
router.patch("/activities/:id/request-proof", activityAdminController.requestMoreProof);

// ─── NGO Project Verification ────────────────────────────────
router.get("/ngo/projects/pending", ngoProjectAdminController.getPendingProjects);  // All pending NGO projects
router.get("/ngo/projects/:id", ngoProjectAdminController.getProjectById);      // Project detail
router.patch("/ngo/projects/:id/approve", ngoProjectAdminController.approveProject);      // Approve → issue credits
router.patch("/ngo/projects/:id/reject", ngoProjectAdminController.rejectProject);       // Reject with reason

// ─── Wallet & Credits (Admin) ──────────────────────────────
router.get("/wallet/:userId", walletController.getAdminWallet); // View any user's wallet

// ─── Marketplace Listings (Admin) ─────────────────────────────
router.get("/listings/pending", listingAdminController.getPendingListings); // Listings awaiting approval
router.patch("/listings/:id/approve", listingAdminController.approveListing);     // Approve listing
router.patch("/listings/:id/reject", listingAdminController.rejectListing);      // Reject listing

// ─── Purchases & Escrow (Admin) ───────────────────────────────
router.get("/escrow", escrowAdminController.getEscrowOrders);    // All escrow-held orders
router.patch("/escrow/:orderId/release", escrowAdminController.releaseEscrow);      // Release → seller paid
router.patch("/escrow/:orderId/refund", escrowAdminController.refundBuyer);        // Refund buyer

// ─── Retirement Audit Log (Admin) ─────────────────────────────
router.get("/retirements", async (req, res) => {
  try {
    const retirements = await retirementModel.getAllRetirements();
    res.json({ total: retirements.length, retirements });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch retirements" });
  }
});

// ─── Disputes (Admin) ─────────────────────────────────────────
router.get("/disputes", disputeController.getAllDisputes);     // All disputes (?status=OPEN|RESOLVED|CLOSED)
router.patch("/disputes/:id/resolve", disputeController.resolveDispute);    // Resolve with decision
router.patch("/disputes/:id/close", disputeController.closeDispute);      // Close dispute

// ─── Reports & Analytics (Admin) ──────────────────────────────
router.get("/reports/dashboard", reportsController.getDashboard);
router.get("/reports/credits-issued", reportsController.getCreditsIssued);
router.get("/reports/marketplace", reportsController.getMarketplaceReport);
router.get("/reports/users", reportsController.getUserStats);
router.get("/reports/commission", reportsController.getCommissionSummary);
router.get("/reports/compliance", reportsController.getComplianceReport);

module.exports = router;
