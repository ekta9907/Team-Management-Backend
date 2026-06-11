const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const LeaveSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    unitId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true }],
    roleName: { type: String, required: true },
    leaveType: {
      type: String,
      enum: ["Unplanned", "Planned", "Sick", "Maternity", "Paternity"],
      default: "Unplanned",
    },
    paidLeaveCount: { type: Number, default: 0, enum: [0, 0.5, 1] },
    maternityLeaveCount: { type: Number, default: 0, enum: [0, 0.5, 1] },
    paternityLeaveCount: { type: Number, default: 0, enum: [0, 0.5, 1] },
    dayType: {
      type: String,
      enum: ["FullDay", "FirstHalf", "SecondHalf"],
      default: "FullDay",
    },
    leaveDates: [{ type: Date, required: true, default: null }],
    dates: [{ type: String, required: true, default: null }],
    totalDays: { type: Number, required: true, default: 0 },
    reason: { type: String, required: true, default: null },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
    },
    documents: [{ type: String, required: true, default: null }],
    appliedAt: { type: Date, default: Date.now },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null }, // Date when leave was approved/rejected
    approvedByComment: { type: String, default: null }, // Date when leave was approved/rejected
    leavesDeductionStatus: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        unitId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true }],
        roleName: { type: String, required: true },
        leaveType: {
          type: String,
          enum: ["Unplanned", "Planned", "Sick", "Maternity", "Paternity"],
          default: "Unplanned",
        },
        dayType: {
          type: String,
          enum: ["FullDay", "FirstHalf", "SecondHalf"],
          default: "FullDay",
        },
        totalDay: { type: Number, required: true, default: 0, enum: [0, 0.5, 1] },
        leaveDate: { type: Date, required: true, default: null },
        paidType: {
          type: String,
          enum: ["Unpaid", "HalfDayPaid", "Paid"],
          default: "Unpaid",
        },
        paidLeaveCount: { type: Number, default: 0, enum: [0, 0.5, 1] },
        maternityLeaveCount: { type: Number, default: 0, enum: [0, 0.5, 1] },
        paternityLeaveCount: { type: Number, default: 0, enum: [0, 0.5, 1] },
      },
    ],
    activeFlag: { type: Number, default: 1 },
    deleteFlag: { type: Number, default: 0 },
  },
  { timestamps: true }
);


module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.Leave) {
    return dbConnection.models.Leave;
  }
  return dbConnection.model("Leave", LeaveSchema);
};