// server/models/Counter.js
const mongoose = require("mongoose");

const CounterSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

CounterSchema.statics.next = async function (key) {
  const row = await this.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return row.seq;
};

module.exports = mongoose.model("Counter", CounterSchema);
