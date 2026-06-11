const mongoose = require("mongoose");

const AccessPreference = new mongoose.Schema(
  {
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
    roleName: { type: String, required: true },
    accessLevel: [
      {
        preferenceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Preference",
        },
        label: { type: String, required: true },
        levelName: { type: String, required: true },
        briefDescription: { type: String, default: null },
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
        preference: mongoose.Schema.Types.Mixed,
      },
    ],
    activeFlag: { type: Number, default: 1 },
    deleteFlag: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AccessPreference", AccessPreference);
