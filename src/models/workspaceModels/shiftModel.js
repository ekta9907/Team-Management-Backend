const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const ShiftSchema = new mongoose.Schema(
  {
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    shiftName: { type: String, required: true },
    weekWorkingDays: { type: [String], required: true, default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
    totalWorkingDurationInDay: { type: Number, required: true, default: 0 },
    startTime: { type: String, required: true, default: "00:00" },
    endTime: { type: String, required: true, default: "00:00" },
    breakDuration: { type: Number, default: 0 },
    breakStartTime: { type: String, default: "" },
    breakEndTime: { type: String, default: "" },
    weekEnds: { type: [String], default: ["Saturday", "Sunday"] },
    monthlyExtraWorkingDays: { type: [String], default: ["secondSaturday", "fourthSaturday"] },
    halfDayStatus: { type: Number, default: 0, enum: [0, 1] },
    firstHalfDayStartTime: { type: String, default: "00:00" },
    firstHalfDayEndTime: { type: String, default: "00:00" },
    firstHalfDuration: { type: Number, required: true, default: 0 },
    secHalfDayStartTime: { type: String, default: "00:00" },
    secHalfDayEndTime: { type: String, default: "00:00" },
    secHalfDuration: { type: Number, required: true, default: 0 },
    halfDayShortLoginExceedStatus: { type: Number, default: 0, enum: [0, 1] },
    halfDayShortLoginMin: { type: Number, default: 0 },
    religiousBreakMin: { type: Number, default: 0 },
    monthlyExtraFreeMin: { type: Number, default: 0 },
    holidays: [], // Reference to Holiday model
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

    unPlannedLeaveExtraDeduction: { type: Number, default: 0.25 },
    plannedLeaveApplyBeforeDays: { type: Number, default: 1 },
    sickLeavePaidUnpaidStatus: { type: Number, enum: [0, 1], default: 1 },
    sickLeaveDocumentDay: { type: Number, enum: [1, 2, 3], default: 2 },
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
    weekOnceLeaveUnplanned: { type: Number, default: 0, enum: [0, 1] }, // 0 = only once day deduction in week  1= full week deduction
    pfDeduction: { type: Number, default: 0 },
    esicDeduction: { type: Number, default: 0 },
    ptDeduction: { type: Number, default: 0 },
    otherAndTdsDeduction: { type: Number, default: 0 },
    shiftIsFixed: { type: Number, default: 1, enum: [0, 1] },
    activeFlag: { type: Number, default: 1, enum: [0, 1] },
    deleteFlag: { type: Number, default: 0, enum: [0, 1] },
    timeZone: { type: String, default: "Asia/Kolkata" },
  },
  { timestamps: true }
);


module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.Shift) {
    return dbConnection.models.Shift;
  }
  return dbConnection.model("Shift", ShiftSchema);
};
