const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const UserNotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the user who received the notification
      ref: "User",
      required: true,
    },
    deviceType: {
      type: String,
      required: true,
    },
    loginType: {
      type: String,
      required: true,
    },
    playerId: {
      type: String,
      required: true,
    },
    deleteFlag: {
      type: Number,
      default: 0,
      enum: [0, 1],
    },
  },
  { timestamps: true }
);


module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.UserNotification) {
    return dbConnection.models.UserNotification;
  }
  return dbConnection.model("UserNotification", UserNotificationSchema);
};