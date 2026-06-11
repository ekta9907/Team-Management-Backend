const mongoose = require("mongoose");

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

module.exports = mongoose.model("UserNotification", UserNotificationSchema);
