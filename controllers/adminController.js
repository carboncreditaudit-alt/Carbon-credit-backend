const adminModel = require("../models/adminModel");

// Get pending users
exports.getPendingUsers = async (req, res) => {
  try {
    const users = await adminModel.getPendingUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// Approve user
exports.approveUser = async (req, res) => {
  const { userId } = req.params;

  try {
    await adminModel.updateUserStatus(userId, "ACTIVE");
    res.json({ message: "User approved successfully" });
  } catch {
    res.status(500).json({ message: "Approval failed" });
  }
};

// Reject user
exports.rejectUser = async (req, res) => {
  const { userId } = req.params;

  try {
    await adminModel.updateUserStatus(userId, "REJECTED");
    res.json({ message: "User rejected" });
  } catch {
    res.status(500).json({ message: "Rejection failed" });
  }
};