const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./config/db");

//files to import for routes
const authRoutes = require("./routes/authRoute");
const adminRoutes = require("./routes/admin/adminRoute");
const profileRoutes = require("./routes/profileRoute");
const activityRoutes = require("./routes/activityRoute");
const ngoProjectRoutes = require("./routes/ngoProjectRoute");
const walletRoutes = require("./routes/walletRoute");
const listingRoutes = require("./routes/listingRoute");
const orderRoutes = require("./routes/orderRoute");
const retirementRoutes = require("./routes/retirementRoute");
const disputeRoutes = require("./routes/disputeRoute");


const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

//Root Api routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/ngo/projects", ngoProjectRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/retirement", retirementRoutes);
app.use("/api/disputes", disputeRoutes);


// Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Carbon Credit Backend is running 🚀",
    status: "OK",
  });
});


// 🔗 Check DB connection on startup
async function startServer() {
  try {
    await db.execute("SELECT 1");
    console.log("✅ Database connected successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server started on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed");
    console.error(error);
    process.exit(1); // Stop app if DB is not reachable
  }
}

startServer();
