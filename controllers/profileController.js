const profileModel = require("../models/profileModel");
const path = require("path");

// ─── GET OWN PROFILE ──────────────────────────────────────────
exports.getMyProfile = async (req, res) => {
  const { userId, role } = req.user;

  try {
    const user = await profileModel.getUserById(userId);
    let profile = null;

    if (role === "FARMER") profile = await profileModel.getFarmerProfile(userId);
    if (role === "NGO") profile = await profileModel.getNgoProfile(userId);
    if (role === "COMPANY") profile = await profileModel.getCompanyProfile(userId);
    if (role === "ADMIN") profile = { message: "Admin account" };

    res.json({ user, profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

// ─── UPDATE OWN PROFILE ───────────────────────────────────────
exports.updateMyProfile = async (req, res) => {
  const { userId, role } = req.user;

  try {
    if (role === "FARMER") await profileModel.updateFarmerProfile(userId, req.body);
    if (role === "NGO") await profileModel.updateNgoProfile(userId, req.body);
    if (role === "COMPANY") await profileModel.updateCompanyProfile(userId, req.body);

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

// ─── UPLOAD KYC DOCUMENT ──────────────────────────────────────
exports.uploadKyc = async (req, res) => {
  const { userId } = req.user;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Normalize path for DB storage
    const relativePath = path
      .relative(process.cwd(), req.file.path)
      .replace(/\\/g, "/");

    await profileModel.upsertKycRecord(userId, relativePath);

    res.status(201).json({
      message: "KYC document uploaded successfully. Pending admin review.",
      file_path: relativePath,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "KYC upload failed" });
  }
};

// ─── GET KYC STATUS ───────────────────────────────────────────
exports.getKycStatus = async (req, res) => {
  const { userId } = req.user;

  try {
    const kyc = await profileModel.getKycRecord(userId);

    if (!kyc) {
      return res.status(404).json({ message: "No KYC document submitted yet" });
    }

    res.json({ kyc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch KYC status" });
  }
};

// ─── BANK ACCOUNT ─────────────────────────────────────────────
exports.upsertBankAccount = async (req, res) => {
  const { userId, role } = req.user;

  try {
    if (!["FARMER", "NGO"].includes(role)) {
      return res.status(403).json({ message: "Only Farmers and NGOs can add bank accounts" });
    }

    const { account_number, bank_name, ifsc_code } = req.body;
    if (!account_number || !bank_name || !ifsc_code) {
      return res.status(400).json({ message: "account_number, bank_name, and ifsc_code are required" });
    }

    await profileModel.updateBankAccount(userId, role, req.body);
    res.json({ message: "Bank account updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update bank account" });
  }
};

// ─── PAYMENT METHOD ───────────────────────────────────────────
exports.upsertPaymentMethod = async (req, res) => {
  const { userId, role } = req.user;

  try {
    if (role !== "COMPANY") {
      return res.status(403).json({ message: "Only Companies can add payment methods" });
    }

    const { payment_method } = req.body;
    if (!payment_method) {
      return res.status(400).json({ message: "payment_method is required" });
    }

    await profileModel.updatePaymentMethod(userId, payment_method);
    res.json({ message: "Payment method updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update payment method" });
  }
};

// ─── ACCEPT TERMS ─────────────────────────────────────────────
exports.acceptTerms = async (req, res) => {
  const { userId } = req.user;

  try {
    await profileModel.acceptTerms(userId);
    res.json({ message: "Terms and carbon participation agreement accepted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to accept terms" });
  }
};