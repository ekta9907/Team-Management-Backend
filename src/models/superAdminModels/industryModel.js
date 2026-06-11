const mongoose = require("mongoose");

const IndustrySchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    industryName: {
      type: String,
      required: true,
      trim: true,
    },
    activeFlag: {
      type: Number,
      enum: [0, 1],
      default: 1,
    },
    deleteFlag: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Industry", IndustrySchema);
