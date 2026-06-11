const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema(
  {
    aboutUs: { type: String, required: true },
    termsAndConditions: { type: String, required: true },
    privacyPolicy: { type: String, required: true },
    activeFlag: { type: Number, default: 1, enum: [0, 1] },
    deleteFlag: { type: Number, default: 0, enum: [0, 1] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Content", contentSchema);
