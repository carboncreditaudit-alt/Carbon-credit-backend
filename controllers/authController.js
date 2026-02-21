const bcrypt = require("bcrypt");
const authModel = require("../models/authModel");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { email, phone, password, role, profile } = req.body;

  try {
    if (!email || !password || !role)
      return res.status(400).json({ message: "Missing required fields" });

    const passwordHash = await bcrypt.hash(password, 10);

    // 1️⃣ Create user
    const userId = await authModel.createUser(email, phone, passwordHash, role);

    // 2️⃣ Create role-specific profile
    if (role === "FARMER") {
      await authModel.createFarmerProfile(userId, profile);
    }

    if (role === "NGO") {
      await authModel.createNgoProfile(userId, profile);
    }

    if (role === "COMPANY") {
      await authModel.createCompanyProfile(userId, profile);
    }

    // 3️⃣ Create wallet
    await authModel.createWallet(userId);

    res.status(201).json({
      message: "Registration successful. Awaiting admin verification.",
      userId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1️⃣ Find user
    const user = await authModel.findUserByEmail(email);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    // 2️⃣ Check approval status
    if (user.status !== "ACTIVE")
      return res.status(403).json({
        message: "Account pending admin approval"
      });

    // 3️⃣ Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // 4️⃣ Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 5️⃣ Send response
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed" });
  }
};