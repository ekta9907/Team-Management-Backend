const mongoose = require("mongoose");
const RoleSchema = new mongoose.Schema(
  {
    roleName: { type: String, required: true },
    activeFlag: { type: Number, default: 1 },
    deleteFlag: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Role", RoleSchema);
