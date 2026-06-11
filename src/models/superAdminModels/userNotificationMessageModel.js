const mongoose = require("mongoose");

const UserNotificationMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    otherUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    actionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    actionJson: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    title1: {
      type: String,
      required: false,
    },
    title2: {
      type: String,
      required: false,
    },
    title3: {
      type: String,
      required: false,
    },
    title4: {
      type: String,
      required: false,
    },
    message1: {
      type: String,
      required: true,
    },
    message2: {
      type: String,
      required: true,
    },
    message3: {
      type: String,
      required: true,
    },
    message4: {
      type: String,
      required: true,
    },
    option: { type: mongoose.Schema.Types.Mixed, required: false },
    appType: {
      type: String,
      enum: ["customer", "driver", "web", "other"],
      required: true,
    },
    notificationOrActivity: {
      type: Number,
      default: 0,
      enum: [0, 1], // notification = 0 and Activity=1
    },
    readStatus: {
      type: Number,
      default: 0,
      enum: [0, 1],
    },
    deleteFlag: {
      type: Number,
      default: 0,
      enum: [0, 1],
    },
  },
  { timestamps: true }
);

const UserNotificationMessage = mongoose.model("UserNotificationMessage", UserNotificationMessageSchema);

module.exports = UserNotificationMessage;
