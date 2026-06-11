const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const ProjectTaskDependencySchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectTask",
      required: true,
    },
    dependsOnTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectTask",
      required: true,
    },
    type: {
      type: String,
      enum: ["blocks", "depends_on"],
      default: "depends_on",
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
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.ProjectTaskDependency) {
    return dbConnection.models.ProjectTaskDependency;
  }
  return dbConnection.model(
    "ProjectTaskDependency",
    ProjectTaskDependencySchema
  );
};
