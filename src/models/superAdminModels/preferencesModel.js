const mongoose = require("mongoose");
const PreferenceSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    levelName: { type: String, required: true },
    briefDescription: { type: String, default: null },
    preference: mongoose.Schema.Types.Mixed,
    type: {
      type: String,
      enum: ["boolean", "select", "number", "text", "button"],
      required: true,
    },
    options: {
      type: [
        {
          label: { type: String, required: true },
          value: mongoose.Schema.Types.Mixed,
        },
      ],
      default: undefined, // You can set a default list below if needed
    },
    orderBy: { type: Number, default: 1 },
    activeFlag: { type: Number, default: 1 },
    deleteFlag: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Preference", PreferenceSchema);
