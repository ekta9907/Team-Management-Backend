const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const creditPaidLeaveSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Replace with your actual User model name
      required: true,
    },
    uniqueId: {
      type: String, // Format: "YYYY-MM"
      required: true,
    },
    month: {
      type: String, // Format: "YYYY-MM"
      required: true,
    },
    leaveEarned: {
      type: Number,
      required: true,
      default: 0,
    },
    appliedLeave: {
      type: Number,
      required: true,
      default: 0,
    },
    leaveForDeduction: {
      type: Number,
      required: true,
      default: 0,
    },
    carryForward: {
      type: Number,
      required: true,
      default: 0,
    },
    remainingBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    encashed: {
      type: Number,
      required: true,
      default: 0,
    },
    deductedPaidLeaves: {
      type: Number,
      required: true,
      default: 0,
    },
    locked: {
      type: Boolean,
      default: false,
    },
    dbEditLocked: {
      type: Boolean,
      default: false,
    },
    note: {
      type: String,
      default: "",
    },
    leaveData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);


module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.CreditPaidLeave) {
    return dbConnection.models.CreditPaidLeave;
  }
  return dbConnection.model("CreditPaidLeave", CreditPaidLeaveSchema);
};