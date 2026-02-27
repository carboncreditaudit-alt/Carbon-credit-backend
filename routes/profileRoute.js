const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const profileController = require("../controllers/profileController");

router.use(authMiddleware); // All profile routes require authentication

// GET own profile
router.get("/me", profileController.getMyProfile);

// UPDATE own profile
router.put("/me", profileController.updateMyProfile);

// KYC document upload (multipart/form-data, field: kyc_document)
router.post(
    "/kyc/upload",
    upload.single("kyc_document"),
    profileController.uploadKyc
);

// GET own KYC status
router.get("/kyc/status",profileController.getKycStatus);

// Bank account (Farmers & NGOs)
router.post("/bank-account",profileController.upsertBankAccount);
router.put("/bank-account",profileController.upsertBankAccount);

// Payment method (Companies)
router.post("/payment-method",profileController.upsertPaymentMethod);
router.put("/payment-method", profileController.upsertPaymentMethod);

// Accept terms & carbon agreement
router.post("/terms/accept", profileController.acceptTerms);

module.exports = router;