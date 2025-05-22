const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Connection Failed:", err));

// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);


const adminStatsRoutes = require("./routes/adminStats");
app.use("/api/admin", adminStatsRoutes);

const staffRoutes = require("./routes/staff");
app.use("/api/staff", staffRoutes);



// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

