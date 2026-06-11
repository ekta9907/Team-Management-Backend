const mongoose = require("mongoose");

const AccessPermissionSchema = new mongoose.Schema(
  {
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
    roleName: { type: String, required: true },
    accessLevel: [
      {
        permissionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Permission",
          default: null,
        },
        label: { type: String, required: true },
        levelName: { type: String, required: true },
        description: { type: String, required: true },
        briefDescription: { type: String, default: null },
        orderBy: { type: Number, default: 1 },
        permissions: {
          type: [String],
          default: [],
        },
      },
    ],
    activeFlag: { type: Number, default: 1 },
    deleteFlag: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AccessPermission", AccessPermissionSchema);
