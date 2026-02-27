const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const profileController = require("../controllers/profileController");

// GET own profile
router.get("/me", authMiddleware, profileController.getMyProfile);

// UPDATE own profile
router.put("/me", authMiddleware, profileController.updateMyProfile);

// KYC document upload (multipart/form-data, field: kyc_document)
router.post(
    "/kyc/upload",
    authMiddleware,
    upload.single("kyc_document"),
    profileController.uploadKyc
);

// GET own KYC status
router.get("/kyc/status", authMiddleware, profileController.getKycStatus);

// Bank account (Farmers & NGOs)
router.post("/bank-account", authMiddleware, profileController.upsertBankAccount);
router.put("/bank-account", authMiddleware, profileController.upsertBankAccount);

// Payment method (Companies)
router.post("/payment-method", authMiddleware, profileController.upsertPaymentMethod);
router.put("/payment-method", authMiddleware, profileController.upsertPaymentMethod);

// Accept terms & carbon agreement
router.post("/terms/accept", authMiddleware, profileController.acceptTerms);

module.exports = router;