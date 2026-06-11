const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const PunchSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  timeString: { type: String, required: true },
  time: { type: Date, required: true },
  type: {
    type: String,
    enum: ["IN", "OUT", "POSIN", "POSOUT"],
    required: true,
  },
  image: { type: String, default: "" },
  address: { type: String, default: "" },
  latitude: { type: String, default: "" },
  longitude: { type: String, default: "" },
});
const CompoffSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    unitId: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },
    ],
    roleName: { type: String, required: true },
    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attendance",
      default: null,
    },
    originalPunches: [PunchSchema],
    type: {
      type: String,
      enum: ["Holiday", "Weekend", "Holiday (Weekend)", "Extra-Hours"],
      default: "Extra-Hour",
    },
    dayType: {
      type: String,
      enum: ["Full Day", "Half Day"],
      default: "Half Day",
    },
    date: { type: Date, required: true },
    workedMin: { type: Number, default: null },
    amount: { type: Number, default: 0 },
    finalAmount: { type: Number, default: 0 },
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
  if (dbConnection.models.Compoff) {
    return dbConnection.models.Compoff;
  }
  return dbConnection.model("Compoff", CompoffSchema);
};