// server/controllers/authController.js
const User = require("../models/User");
const Pharmacy = require("../models/Pharmacy");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// small helper (kept for future use)
const pick = (obj, keys) => {
  const out = {};
  keys.forEach((k) => (out[k] = obj?.[k]));
  return out;
};

/**
 * POST /api/auth/register
 * Supports role "pharmacy" with optional logo upload (multer: field name "logo")
 * - Creates User
 * - Creates Pharmacy linked to user (inactive, pending approval)
 */
exports.register = async (req, res) => {
  try {
    const {
      // account
      ownerName,
      email,
      password,
      phone,
      // profile
      pharmacyName,
      licenseNo,
      binVat,
      pharmacyType,
      establishedYear,
      staffCount,
      openingHours,
      website,
      // address
      division,
      district,
      upazila,
      street,
      postcode,
      // role
      role, // expected "pharmacy" for this flow
    } = req.body;

    // basic uniqueness check
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "User already exists" });

    // create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name: ownerName || "",
      email,
      password: hashedPassword,
      role: role || "pharmacy",
    });
    await user.save();

    // if pharmacy role, create linked Pharmacy (pending + inactive until admin approval)
    let pharmacy = null;
    if ((role || "pharmacy") === "pharmacy") {
      const logoFile = req.file; // multer single("logo")
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
        // Approval flags
        approvalStatus: "pending",
        isActive: false,
        rejectionReason: "",
      });

      await pharmacy.save();
    }

    return res.status(201).json({
      msg: "Registration submitted. Your pharmacy is pending approval.",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      pharmacy,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

/**
 * POST /api/auth/login
 * Returns JWT and user. If role is pharmacy, also returns approvalStatus to help client route.
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password || "");
    if (!match) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });

    // For pharmacy users, surface current approval status (if exists)
    let approvalStatus = null;
    if (user.role === "pharmacy") {
      const p = await Pharmacy.findOne({ ownerUserId: user._id }).select("approvalStatus");
      approvalStatus = p?.approvalStatus || null;
    }

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      approvalStatus,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
