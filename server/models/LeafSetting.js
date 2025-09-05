const mongoose = require("mongoose");

const leafSettingSchema = new mongoose.Schema(
  {
    leafType: { type: String, required: true, trim: true },
    totalNumber: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LeafSetting", leafSettingSchema);
