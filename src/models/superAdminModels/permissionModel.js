const mongoose = require("mongoose");
const PermissionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    levelName: { type: String, required: true },
    description: { type: String, required: true },
    briefDescription: { type: String, default: null },
    permissions: {
      type: [String],
      default: ["list", "view", "add", "edit", "delete"],
    },
    orderBy: { type: Number, default: 1 },
    activeFlag: { type: Number, default: 1 },
    deleteFlag: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Permission", PermissionSchema);
