const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const ProjectTaskListSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    listIcon: { type: String, default: "📊" },
    name: { type: String, required: true },
    description: { type: String, default: null },
    orderIndex: { type: Number, default: 0 }, // for ordering lists
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    viewBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    activeFlag: { type: Number, enum: [0, 1], default: 1 },
    deleteFlag: { type: Number, enum: [0, 1], default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.ProjectTaskList) {
    return dbConnection.models.ProjectTaskList;
  }
  return dbConnection.model("ProjectTaskList", ProjectTaskListSchema);
};
