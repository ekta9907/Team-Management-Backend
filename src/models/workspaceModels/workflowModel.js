const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const StageSchema = new mongoose.Schema(
  {
    stageName: { type: String, required: true, trim: true },
    color: { type: String, required: true },
    order: { type: Number, required: true },
  },
  {
    timestamps: false, // Disable createdAt & updatedAt
  }
);


const WorkflowSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    stages: {
      type: [StageSchema],
      default: [
        {
          name: "Backlog",
          color: "#D3D3D3",
          order: 1,
        },
      ],
    },
    activeFlag: { type: Number, default: 1 },
    deleteFlag: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.Workflow) {
    return dbConnection.models.Workflow;
  }
  return dbConnection.model("Workflow", WorkflowSchema);
};
