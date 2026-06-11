const mongoose = require("mongoose");

const subFeatureSchema = new mongoose.Schema(
  {
    featureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Feature",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    keyName: { type: String, required: true, trim: true },
    valueType: {
      type: String,
      enum: ["boolean", "string", "number"],
      required: true,
    },
    activeFlag: { type: Number, default: 1, enum: [0, 1] },
    deleteFlag: { type: Number, default: 0, enum: [0, 1] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubFeature", subFeatureSchema);
