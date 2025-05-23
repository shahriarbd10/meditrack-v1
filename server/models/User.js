const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: {
    type: String,
    required: function() {
      // Only require password if role is NOT 'normal' (OAuth or guest users)
      return this.role !== "normal";
    }
  },
  role: {
    type: String,
    enum: ["admin", "pharmacy", "staff", "normal"],
    required: true,
  },
  pharmacyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",  // Reference to User model (pharmacy user)
    required: function() {
      // Only required if role is staff
      return this.role === "staff";
    },
  },
  // other fields as needed...
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
