const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./config/db");

//files to import for routes
const authRoutes = require("./routes/authRoute");
const adminRoutes = require("./routes/adminRoute");
const profileRoutes = require("./routes/profileRoute");


const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

//Root Api routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);


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
