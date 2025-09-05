require('dotenv').config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User"); // Adjust path if necessary

const adminEmail = "shahriarsgrii@gmail.com";
const adminPassword = "meditrackbd"; 
const adminRole = "admin"; 

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => {
  console.error("❌ MongoDB Connection Failed:", err);
  process.exit(1);
});

async function createAdmin() {
  try {
    const exists = await User.findOne({ email: adminEmail });
    if (exists) {
      console.log("Admin user already exists.");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser = new User({
      name: "Admin",
      email: adminEmail,
      password: hashedPassword,
      role: adminRole,
    });

    await adminUser.save();
    console.log("✅ Admin user created successfully!");
    process.exit();
  } catch (err) {
    console.error("❌ Error creating admin:", err);
    process.exit(1);
  }
}

createAdmin();
