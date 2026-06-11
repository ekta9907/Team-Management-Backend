// models/workspaceModels/proofModel.js

const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const ProofSchema = new mongoose.Schema(
  {
    proofName: {
      type: String,
      required: true,
      trim: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ["Project", "Task", "Campaign", "Company"], // add more as needed
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    file: { type: String, required: true },
    link: {
      type: String, // optional link instead of file
    },
    description: {
      type: String,
      trim: true,
    },
    reviewers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["Can approve", "Can comment"],
          default: "Can comment",
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
  if (dbConnection.models.Proof) {
    return dbConnection.models.Proof;
  }
  return dbConnection.model("Proof", ProofSchema);
};
