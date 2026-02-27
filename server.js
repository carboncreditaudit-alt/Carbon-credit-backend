const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./config/db");

const authRoutes = require("./routes/authRoute");
const profileRoutes = require("./routes/profileRoute");
const walletRoutes = require("./routes/walletRoute");
const disputeRoutes = require("./routes/disputeRoute");
const listingRoutes = require("./routes/listingRoute");

const ngoProjectRoutes = require("./routes/ngo/ngoProjectRoute");

const farmerActivityRoutes = require("./routes/farmer/activityRoute");

const companyOrderRoutes = require("./routes/company/orderRoute");

const adminActivityRoutes = require("./routes/admin/activityRoute");
const adminDisputeRoutes = require("./routes/admin/disputeRoute");
const adminEscrowRoutes = require("./routes/admin/escrowRoute");
const adminListingRoutes = require("./routes/admin/listingRoute");
const adminNgoProjectRoutes = require("./routes/admin/ngoProjectRoute");
const adminReportRoutes = require("./routes/admin/reportRoute");
const adminUserRoutes = require("./routes/admin/userRoute");
const adminWalletRoutes = require("./routes/admin/walletRoute");


const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

//common routes that all users can access
app.use("/api/auth", authRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/listing", listingRoutes);


// NGO routes
app.use("/api/ngo/projects", ngoProjectRoutes);


//farmer routes
app.use("/api/farmer/activity", farmerActivityRoutes);

//company routes
app.use("/api/company/orders", companyOrderRoutes);

//Admin routes
app.use("/api/admin/activity", adminActivityRoutes);
app.use("/api/admin/disputes", adminDisputeRoutes);
app.use("/api/admin/escrow", adminEscrowRoutes);
app.use("/api/admin/listings", adminListingRoutes);
app.use("/api/admin/ngo-projects", adminNgoProjectRoutes);
app.use("/api/admin/reports", adminReportRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/wallets", adminWalletRoutes);

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
