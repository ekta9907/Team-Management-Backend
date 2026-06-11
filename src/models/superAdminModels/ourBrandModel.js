const mongoose = require("mongoose");

const ourBrandSchema = new mongoose.Schema(
  {
    brandName: { type: String, required: true },
    brandImg: { type: String, required: true },
    activeFlag: { type: Number, default: 1, enum: [0, 1] },
    deleteFlag: { type: Number, default: 0, enum: [0, 1] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OurBrand", ourBrandSchema);
