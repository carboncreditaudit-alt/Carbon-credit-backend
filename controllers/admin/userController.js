const profileModel = require("../../models/profileModel");

// GET /api/admin/users?role=&status=
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
        const user = await profileModel.getUserByIdAdmin(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Fetch role-specific profile
        let profile = null;
        if (user.role === "FARMER") profile = await profileModel.getFarmerProfile(userId);
        if (user.role === "NGO") profile = await profileModel.getNgoProfile(userId);
        if (user.role === "COMPANY") profile = await profileModel.getCompanyProfile(userId);

        // Fetch KYC record
        const kyc = await profileModel.getKycRecord(userId);

        res.json({ user, profile, kyc: kyc || null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch user" });
    }
};
