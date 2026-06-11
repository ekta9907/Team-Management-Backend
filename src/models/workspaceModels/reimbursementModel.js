const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const ReimbursementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    unitId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true }],
    roleName: { type: String, required: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    finalAmount: { type: Number, required: true },
    description: { type: String, required: true, default: null },
    documents: [{ type: String, default: null }],
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
    },
    paidStatus: {
      type: String,
      enum: ["Pending", "Unpaid", "Paid"],
      default: "Unpaid",
    },
    paidMonth: { type: String, default: null },
    approvedRoleName: { type: String, default: null },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
    },
    approvedComment: { type: String, default: null },
    approvedAt: { type: Date, default: null },
    managerApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    managerApprovedStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
    },
    managerApprovedComment: { type: String, default: null },
    managerApprovedAt: { type: Date, default: null },
    appliedAt: { type: Date, default: Date.now },
    activeFlag: { type: Number, default: 1 },
    deleteFlag: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.Reimbursement) {
    return dbConnection.models.Reimbursement;
  }
  return dbConnection.model("Reimbursement", ReimbursementSchema);
};
