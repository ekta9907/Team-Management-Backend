const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const ProjectTaskTimeReportSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    totalMinutes: {
      type: Number,
      default: 0,
    },
    totalBillableMinutes: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.ProjectTaskTimeReport) {
    return dbConnection.models.ProjectTaskTimeReport;
  }
  return dbConnection.model(
    "ProjectTaskTimeReport",
    ProjectTaskTimeReportSchema
  );
};
