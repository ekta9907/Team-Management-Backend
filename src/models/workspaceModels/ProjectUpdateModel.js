const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const reactionUserSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { _id: false },
);

const reactionSchema = new mongoose.Schema(
  {
    emoji: {
      type: String, // 👍 ❤️ 😂 😮 😢 👀 etc
      required: true,
    },
    count: {
      type: Number,
      default: 0,
    },
    users: [reactionUserSchema], 
  },
  { _id: false },
);

const projectUpdateSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    description: { type: String, required: true },

    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    peopleIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    ],

    notifyIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    ],

    projectHealthLabels: {
      color: { type: String, default: "#808080" },
      text: { type: String, default: "Not set" },
    },

    reactions: [reactionSchema],

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
  if (dbConnection.models.ProjectUpdate) {
    return dbConnection.models.ProjectUpdate;
  }
  return dbConnection.model("ProjectUpdate", projectUpdateSchema);
};
