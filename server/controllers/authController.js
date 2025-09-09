// server/controllers/authController.js
const User = require("../models/User");
const Pharmacy = require("../models/Pharmacy");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// Helper to safely get field
const pick = (obj, keys) => {
  const out = {};
  keys.forEach((k) => (out[k] = obj?.[k]));
  return out;
};

// Register (supports role: "pharmacy" with extra fields + file upload 'logo')
exports.register = async (req, res) => {
  try {
    const {
      // account
      ownerName, email, password, phone,
      // profile
      pharmacyName, licenseNo, binVat, pharmacyType,
      establishedYear, staffCount, openingHours, website,
      // address
      division, district, upazila, street, postcode,
      role, // expect "pharmacy"
    } = req.body;

    // Check uniqueness
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "User already exists" });

    // Create user (role-sensitive)
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name: ownerName || "",
      email,
      password: hashedPassword,
      role: role || "pharmacy",
    });
    await user.save();

    // If pharmacy role, create Pharmacy profile
    let pharmacy = null;
    if ((role || "pharmacy") === "pharmacy") {
      const logoFile = req.file; // multer attached file
      const logoUrl = logoFile ? `/uploads/${logoFile.filename}` : undefined;

      pharmacy = new Pharmacy({
        ownerUserId: user._id,
        pharmacyName,
        pharmacyType: pharmacyType || "Retail",
        licenseNo,
        binVat: binVat || "",
        establishedYear: establishedYear ? Number(establishedYear) : undefined,
        staffCount: staffCount ? Number(staffCount) : 1,
        openingHours: openingHours || "",
        website: website || "",
        phone: phone || "",
        address: {
          division: division || "",
          district: district || "",
          upazila: upazila || "",
          street: street || "",
          postcode: postcode || "",
        },
        logoUrl,
      });
      await pharmacy.save();
    }

    return res.status(201).json({
      msg: "User registered successfully",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      pharmacy,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

// Login (unchanged)
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password || "");
    if (!match) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};
