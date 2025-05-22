const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: {
    type: String,
    required: function() {
      // Only require password if role is NOT 'normal' (OAuth users)
      return this.role !== "normal";
    }
  },
  role: {
    type: String,
    enum: ["admin", "pharmacy", "staff", "normal"], // add "normal" here
    required: true,
  },
  // other fields...
});

module.exports = mongoose.model("User", UserSchema);
