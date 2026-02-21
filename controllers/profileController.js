const profileModel = require("../models/profileModel");

exports.getMyProfile = async (req, res) => {
  const { userId, role } = req.user;

  try {
    // Base user info
    const user = await profileModel.getUserById(userId);

    let profile = null;

    if (role === "FARMER") {
      profile = await profileModel.getFarmerProfile(userId);
    }

    if (role === "NGO") {
      profile = await profileModel.getNgoProfile(userId);
    }

    if (role === "COMPANY") {
      profile = await profileModel.getCompanyProfile(userId);
    }

    if (role === "ADMIN") {
      profile = { message: "Admin account" };
    }

    res.json({
      user,
      profile
    });

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};