const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const PunchSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  timeString: { type: String, required: true },
  time: { type: Date, required: true },
  type: { type: String, enum: ["IN", "OUT", "POSIN", "POSOUT"], required: true },
  image: { type: String, default: "" },
  address: { type: String, default: "" },
  latitude: { type: String, default: "" },
  longitude: { type: String, default: "" },
});

const RegularizationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    unitId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true }],
    roleName: { type: String, required: true },
    attendanceId: { type: mongoose.Schema.Types.ObjectId, ref: "Attendance" },
    date: { type: Date, required: true },
    originalPunches: [PunchSchema],
    requestedPunches: [PunchSchema],
    reason: { type: String, required: true, default: null },
    documents: [{ type: String, default: null }],
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
    },
    approvedRoleName: { type: String, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvedStatus: { type: String, enum: ["Pending", "Approved", "Rejected", "Cancelled"], default: "Pending" },
    approvedComment: { type: String, default: null },
    approvedAt: { type: Date, default: null },
    managerApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    managerApprovedStatus: { type: String, enum: ["Pending", "Approved", "Rejected", "Cancelled"], default: "Pending" },
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
  if (dbConnection.models.Regularization) {
    return dbConnection.models.Regularization;
  }
  return dbConnection.model("Regularization", RegularizationSchema);
};
