const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const CommentReplaySchema = new mongoose.Schema(
  {
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    entityType: {
      type: String,
      enum: ["Project", "Task", "Message", "Notebook", "Proof"],
      default: 1,
    },
    notifyIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    ],
    commentReplayText: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    files: [],
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
  if (dbConnection.models.CommentReplay) {
    return dbConnection.models.CommentReplay;
  }
  return dbConnection.model("CommentReplay", CommentReplaySchema);
};
