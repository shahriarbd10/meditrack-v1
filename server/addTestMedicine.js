// addTestMedicine.js
const mongoose = require("mongoose");
const Medicine = require("./models/Medicine"); // Ensure path to your model is correct
const dotenv = require("dotenv");

dotenv.config(); // Load environment variables

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed:", err);
  });

// Add a new test medicine
const addTestMedicine = async () => {
  const newMedicine = new Medicine({
    name: "Paracetamol",
    genericName: "Acetaminophen",
    brandName: "BrandX",
    price: 15,
    discount: 2,
    expiryDate: "2026-12-31",
    totalUnits: 100,
    unitType: "strip", // can be "strip" or "box"
    buyingPrice: 12,
    form: "Tablet", // Tablet, Syrup, Capsule, etc.
    picture: "https://www.example.com/medicine-image.jpg", // Sample image URL
    amount: "500mg", // Dosage
    description: "Used to relieve pain and reduce fever.",
  });

  try {
    await newMedicine.save(); // Save the medicine to the database
    console.log("✅ Medicine added successfully:", newMedicine);
    mongoose.disconnect(); // Close the database connection after saving
  } catch (err) {
    console.error("❌ Error adding medicine:", err);
  }
};

// Execute the function to add test data
addTestMedicine();
