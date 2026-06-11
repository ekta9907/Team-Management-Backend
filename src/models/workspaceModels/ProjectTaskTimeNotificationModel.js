const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const ProjectTaskTimeNotificationSchema = new mongoose.Schema(
  {
    timeEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectTaskTime",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["reminder", "approval_request", "approval_response"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.ProjectTaskTimeNotification) {
    return dbConnection.models.ProjectTaskTimeNotification;
  }
  return dbConnection.model(
    "ProjectTaskTimeNotification",
    ProjectTaskTimeNotificationSchema
  );
};
