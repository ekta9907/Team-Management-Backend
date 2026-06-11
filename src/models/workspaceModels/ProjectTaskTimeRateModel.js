const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const ProjectTaskTimeRateSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectTask",
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    ratePerHour: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
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

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.ProjectTaskTimeRate) {
    return dbConnection.models.ProjectTaskTimeRate;
  }
  return dbConnection.model("ProjectTaskTimeRate", ProjectTaskTimeRateSchema);
};
