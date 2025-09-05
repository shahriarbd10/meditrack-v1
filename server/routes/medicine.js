// server/routes/medicine.js
const path = require("path");
const fs = require("fs");
const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const Medicine = require("../models/Medicine");

const router = express.Router();

/* ---------- Upload setup ---------- */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max upload
});

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "medicines");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/** compress to ~50-60KB webp, max width ~320 (keeps aspect) */
async function compressToTargetWebp(inputBuffer) {
  let quality = 65;
  let out = await sharp(inputBuffer)
    .resize({ width: 320, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();

  while (out.length > 60 * 1024 && quality > 40) {
    quality -= 5;
    out = await sharp(inputBuffer)
      .resize({ width: 320, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
  }
  return out;
}

// Safely resolve "/uploads/medicines/xxx.webp" to an absolute filesystem path
function toFsPath(urlPath) {
  // remove any leading slash so we stay inside project root
  const rel = (urlPath || "").replace(/^[\\/]+/, "");
  return path.join(process.cwd(), rel);
}

/* ---------- CREATE (multipart) ---------- */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const body = req.body;

    let imageUrl = "";
    if (req.file) {
      const compressed = await compressToTargetWebp(req.file.buffer);
      const fname = `${Date.now()}-${(body.name || "medicine")
        .replace(/[^a-z0-9]+/gi, "-")
        .toLowerCase()}.webp`;
      const fpath = path.join(UPLOAD_DIR, fname);
      fs.writeFileSync(fpath, compressed);
      imageUrl = `/uploads/medicines/${fname}`;
    }

    // parse expiryDate (accepts yyyy-mm-dd)
    let expiryDate = null;
    if (body.expiryDate && !isNaN(Date.parse(body.expiryDate))) {
      expiryDate = new Date(body.expiryDate);
    }

    const doc = await Medicine.create({
      barcode: body.barcode || "",
      strength: body.strength || "",
      boxSize: body.boxSize || "",
      shelf: body.shelf || "",

      category: body.category,
      type: body.type || "",
      supplier: body.supplier,
      unit: body.unit,

      name: body.name,
      genericName: body.genericName,
      details: body.details || "",
      price: Number(body.price) || 0,
      supplierPrice: Number(body.supplierPrice) || 0,
      vat: Number(body.vat) || 0,
      status: body.status === "inactive" ? "inactive" : "active",

      imageUrl,
      expiryDate,
    });

    res.status(201).json({ message: "Medicine created", data: doc });
  } catch (err) {
    console.error("Create medicine error:", err);
    res.status(500).json({ message: "Server error while adding medicine." });
  }
});

/* Keep old /add path working */
router.post("/add", upload.single("image"), (req, res, next) => {
  req.url = "/"; // forward to handler above
  next();
});

/* ---------- LIST ---------- */
router.get("/", async (_req, res) => {
  try {
    const list = await Medicine.find().sort({ createdAt: -1 });
    res.json({ data: list });
  } catch (err) {
    console.error("List medicines error:", err);
    res.status(500).json({ message: "Server error while listing medicines." });
  }
});

/* ---------- GET ONE ---------- */
router.get("/:id", async (req, res) => {
  try {
    const doc = await Medicine.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Medicine not found." });
    res.json({ data: doc });
  } catch (err) {
    console.error("Get medicine error:", err);
    res.status(500).json({ message: "Server error while fetching medicine." });
  }
});

/* ---------- UPDATE (multipart; optional image replace) ---------- */
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const body = req.body;
    const doc = await Medicine.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Medicine not found." });

    // Optional new image
    let imageUrl = doc.imageUrl;
    if (req.file) {
      const compressed = await compressToTargetWebp(req.file.buffer);
      const fname = `${Date.now()}-${(body.name || doc.name || "medicine")
        .replace(/[^a-z0-9]+/gi, "-")
        .toLowerCase()}.webp`;
      const fpath = path.join(UPLOAD_DIR, fname);
      fs.writeFileSync(fpath, compressed);
      const newUrl = `/uploads/medicines/${fname}`;

      // delete old file if it was in our uploads folder
      if (imageUrl && imageUrl.startsWith("/uploads/medicines/")) {
        const oldPath = toFsPath(imageUrl);
        fs.unlink(oldPath, () => {});
      }
      imageUrl = newUrl;
    }

    // expiry
    let expiryDate = doc.expiryDate;
    if (body.expiryDate !== undefined) {
      expiryDate =
        body.expiryDate && !isNaN(Date.parse(body.expiryDate))
          ? new Date(body.expiryDate)
          : null;
    }

    // Update fields
    doc.barcode = body.barcode ?? doc.barcode;
    doc.strength = body.strength ?? doc.strength;
    doc.boxSize = body.boxSize ?? doc.boxSize;
    doc.shelf = body.shelf ?? doc.shelf;

    doc.category = body.category ?? doc.category;
    doc.type = body.type ?? doc.type;
    doc.supplier = body.supplier ?? doc.supplier;
    doc.unit = body.unit ?? doc.unit;

    doc.name = body.name ?? doc.name;
    doc.genericName = body.genericName ?? doc.genericName;
    doc.details = body.details ?? doc.details;
    if (body.price !== undefined) doc.price = Number(body.price) || 0;
    if (body.supplierPrice !== undefined) doc.supplierPrice = Number(body.supplierPrice) || 0;
    if (body.vat !== undefined) doc.vat = Number(body.vat) || 0;
    if (body.status !== undefined) doc.status = body.status === "inactive" ? "inactive" : "active";

    doc.imageUrl = imageUrl;
    doc.expiryDate = expiryDate;

    const saved = await doc.save();
    res.json({ message: "Medicine updated", data: saved });
  } catch (err) {
    console.error("Update medicine error:", err);
    res.status(500).json({ message: "Server error while updating medicine." });
  }
});

/* ---------- DELETE ---------- */
router.delete("/:id", async (req, res) => {
  try {
    const doc = await Medicine.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Medicine not found." });

    // delete file if exists (fix: properly resolve fs path)
    if (doc.imageUrl && doc.imageUrl.startsWith("/uploads/medicines/")) {
      const fpath = toFsPath(doc.imageUrl);
      fs.unlink(fpath, () => {});
    }
    res.json({ message: "Medicine deleted", data: doc });
  } catch (err) {
    console.error("Delete medicine error:", err);
    res.status(500).json({ message: "Server error while deleting medicine." });
  }
});

module.exports = router;
