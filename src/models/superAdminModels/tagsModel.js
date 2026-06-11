const mongoose = require("mongoose");

const TagsSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    color: { type: String, default: "#000000" },
    activeFlag: { type: Number, default: 1 },
    deleteFlag: { type: Number, default: 0 },
    projectId: { type: Number, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tags", TagsSchema);
