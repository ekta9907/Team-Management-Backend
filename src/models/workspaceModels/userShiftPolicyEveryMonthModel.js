const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const UserShiftPaidLeavePolicySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
    },
    uniqueId: { type: String, required: true }, //'YYYY-MM"
    yearMonth: { type: String, required: true }, //'YYYY-MM"
    year: { type: Number, required: true }, //'YYYY"
    salary: { type: Number, default: 0 },
    month: { type: Number, required: true }, //'MM"
    shortLoginDeductions: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        start: {
          type: Number,
          required: true,
        },
        end: {
          type: Number,
          required: true,
        },
        deduction: {
          type: Number,
          required: true,
        },
      },
    ],
    leaveAmountCalMonthDaysStatus: { type: Number, enum: [0, 1], default: 1 },
    totalAnnualPaidLeave: { type: Number, default: 1 },
    eachMonthPaidLeave: { type: Number, default: 1 },
    paidLeaveDay: { type: Number, default: 1 },
    skipPaidLeaveMonth: { type: [String], enum: ["November", "December"] },
    carryForwordPaidLeaveStatus: { type: Number, default: 1, enum: [0, 1] },
    joiningDatePaidLeaveDeductions: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        start: {
          type: Number,
          required: true,
        },
        end: {
          type: Number,
          required: true,
        },
        deduction: {
          type: Number,
          required: true,
        },
      },
    ],
    afterTwoYearExtraPaidLeave: { type: Number, default: 0 },
    initialThreeMonthPaidLeaveStatus: { type: Number, default: 1, enum: [0, 1] }, // 0 =no paid leave given 1= paid leave given
    maternityLeave: { type: Number, default: 0 },
    paternityLeave: { type: Number, default: 0 },
    unPlannedLeaveExtraDeduction: { type: Number, default: 0 },
    plannedLeaveDeduction: { type: Number, default: 0 },
    weekOnceLeaveUnplanned: { type: Number, default: 0, enum: [0, 1] },
    holidays: [],
    monthlyExtraFreeMin: { type: Number, default: 0 },
    weekEnds: { type: [String], default: ["Saturday", "Sunday"] },
    monthlyExtraWorkingDays: { type: [String], default: ["secondSaturday", "fourthSaturday"] },
    weekWorkingDays: { type: [String], required: true, default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
  },
  { timestamps: true }
);
UserShiftPaidLeavePolicySchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });


module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.UserShiftPaidLeavePolicy) {
    return dbConnection.models.UserShiftPaidLeavePolicy;
  }
  return dbConnection.model("UserShiftPaidLeavePolicy", UserShiftPaidLeavePolicySchema);
};
