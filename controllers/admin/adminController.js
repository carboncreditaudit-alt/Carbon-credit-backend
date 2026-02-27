const adminModel = require("../../models/admin/adminModel");
const profileModel = require("../../models/profileModel");

// ─── USER VERIFICATION ────────────────────────────────────────

// GET /api/admin/users/pending
exports.getPendingUsers = async (req, res) => {
  try {
    const users = await adminModel.getPendingUsers();
    res.json({ total: users.length, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch pending users" });
  }
};

// PATCH /api/admin/users/:userId/approve
exports.approveUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await adminModel.getUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    await adminModel.updateUserStatus(userId, "ACTIVE");
    res.json({ message: `User ${user.email} approved successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Approval failed" });
  }
};

// PATCH /api/admin/users/:userId/reject
exports.rejectUser = async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;

  try {
    const user = await adminModel.getUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    await adminModel.setRejectionReason(userId, reason || "No reason provided");
    res.json({ message: `User ${user.email} rejected`, reason: reason || "No reason provided" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Rejection failed" });
  }
};

// GET /api/admin/users/:id/kyc
exports.getUserKyc = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await adminModel.getUserById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const kyc = await adminModel.getKycByUserId(id);
    if (!kyc) return res.status(404).json({ message: "No KYC document submitted for this user" });

    res.json({ user: { id: user.id, email: user.email, role: user.role }, kyc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch KYC" });
  }
};

// ─── KYC VERIFICATION ────────────────────────────────────────

// GET /api/admin/kyc/pending
exports.getPendingKyc = async (req, res) => {
  try {
    const kycs = await adminModel.getPendingKyc();
    res.json({ total: kycs.length, kycs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch pending KYC submissions" });
  }
};

// PATCH /api/admin/kyc/:userId/approve
exports.approveKyc = async (req, res) => {
  const { userId } = req.params;
  try {
    const kyc = await adminModel.getKycByUserId(userId);
    if (!kyc) return res.status(404).json({ message: "KYC record not found" });

    await adminModel.updateKycStatus(userId, "APPROVED");
    res.json({ message: "KYC approved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "KYC approval failed" });
  }
};

// PATCH /api/admin/kyc/:userId/reject
exports.rejectKyc = async (req, res) => {
  const { userId } = req.params;
  try {
    const kyc = await adminModel.getKycByUserId(userId);
    if (!kyc) return res.status(404).json({ message: "KYC record not found" });

    await adminModel.updateKycStatus(userId, "REJECTED");
    res.json({ message: "KYC rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "KYC rejection failed" });
  }
};

// ─── USER LIST & DETAIL (from userController promotion) ───────

// GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status } = req.query;
    const users = await profileModel.getAllUsers({ role, status });
    res.json({ total: users.length, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// GET /api/admin/users/:id
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await adminModel.getUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let profile = null;
    if (user.role === "FARMER") profile = await profileModel.getFarmerProfile(userId);
    if (user.role === "NGO") profile = await profileModel.getNgoProfile(userId);
    if (user.role === "COMPANY") profile = await profileModel.getCompanyProfile(userId);

    const kyc = await adminModel.getKycByUserId(userId);
    res.json({ user, profile, kyc: kyc || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};