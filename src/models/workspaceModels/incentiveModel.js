const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const ShiftSubConditionSchema = new mongoose.Schema(
  {
    target: { type: Number, required: true },
    value: { type: Number, required: true },
  },
  { _id: false }
);

const ShiftIncentiveSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    condition: { type: String, required: true },
    type: { type: String, enum: ["Fixed", "Percentage"], required: true },
    value: {
      type: mongoose.Schema.Types.Mixed, // Can be Number or [Number]
      required: true,
    },
    target: {
      type: mongoose.Schema.Types.Mixed, // Can be Number or [Number]
      required: true,
    },
    subCondition: { type: Boolean, default: false },
    subConditions: {
      type: [ShiftSubConditionSchema],
      default: undefined,
    },
    activeFlag: { type: Number, default: 1 },
    select: { type: Boolean, default: false },
  },
  { _id: false }
);

const IncentiveSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    unitId: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },
    ],
    shiftIncentivePolicyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "shiftIncentivePolicy",
      required: true,
    },
    incentivePolicyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IncentivePolicy",
    },
    shiftId: { type: mongoose.Schema.Types.ObjectId, ref: "Shift" },
    fulllable: { type: String, required: true },
    lable: { type: String, required: true },
    levelName: { type: String, required: true },
    descriptionPolicy: { type: String, default: null },
    documentPolicy: { type: String, default: null },
    incentive: { type: [ShiftIncentiveSchema], default: [] },

    roleName: { type: String, required: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    finalAmount: { type: Number, required: true },
    targetAchieved: { type: Number, required: true },
    projectName: { type: String, default: null },
    clientName: { type: String, default: null },
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
  if (dbConnection.models.Incentive) {
    return dbConnection.models.Incentive;
  }
  return dbConnection.model("Incentive", IncentiveSchema);
};