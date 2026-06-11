const mongoose = require("mongoose");

const featureSchema = new mongoose.Schema(
  {
    keyName: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    activeFlag: { type: Number, default: 1, enum: [0, 1] },
    deleteFlag: { type: Number, default: 0, enum: [0, 1] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feature", featureSchema);
