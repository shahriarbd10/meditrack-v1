const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Route imports
const medicineRoutes = require("./routes/medicine");
const authRoutes = require("./routes/auth");
const adminStatsRoutes = require("./routes/adminStats");
const staffRoutes = require("./routes/staff");
const authGoogleRoutes = require("./routes/authGoogle");

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/medicines", medicineRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/auth", authGoogleRoutes);  // Make sure this doesn't conflict with authRoutes
app.use("/api/admin", adminStatsRoutes);
app.use("/api/staff", staffRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  // Note: these options are no longer necessary in Mongoose 6+, but kept for backward compatibility
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.error("❌ MongoDB Connection Failed:", err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
