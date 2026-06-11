const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const MonthlyProccessSchema = new mongoose.Schema(
  {
    month: { type: String, required: true },
    proccessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proccess", // Reference to User model
      required: true,
    },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to User model
      required: true,
    },
    unitIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Unit" }],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to User model
      required: true,
    },
    uniqueId: { type: String, required: true },
    startDate: { type: Date, required: true }, // When this salary started
    endDate: { type: Date, default: null }, // When this salary ended (null if current)
    startMonth: { type: String, required: true }, // When this salary started
    endMonth: { type: String, default: null },
    remarks: { type: String, default: null }, // When remarks
    salaryGiveByCompany: { type: String, required: true, default: 0 },
    salaryGiveByCompanyYear: {
      type: String,
      default: 0,
    },
    pfEligibility: { type: Number, required: true, default: 0 },
    esicEligibility: { type: Number, required: true, default: 0 },
    ptEligibility: { type: Number, required: true, default: 0 },
    finalBasic: { type: String, default: 0 },
    hra: { type: String, default: 0 },
    otherAllowance: { type: String, default: 0 },
    grossSalary: { type: String, default: 0, required: true },
    actualBasicSalary: { type: String, default: 0 },
    pfMinBasicSalary: { type: String, default: 0 },
    esicMinGrossSalary: { type: String, default: 0 },
    epfp: { type: String, default: 0 }, // employer pf percentage
    epf: { type: String, default: 0 }, // employer pf
    esicp: { type: String, default: 0 }, // employer esic percentage
    esic: { type: String, default: 0 }, // employer esic
    emppfp: { type: String, default: 0 }, // employer pf percentage
    emppf: { type: String, default: 0 }, // employer pf
    empesicp: { type: String, default: 0 }, // employer esic percentage
    empesic: { type: String, default: 0 }, // employer esic
    totalCTC: { type: String, required: true, default: 0 },
    totalCTCYearly: {
      type: String,
      default: 0,
    },
    pt: { type: String, default: 0 },
    otherTDS: { type: String, default: 0 },
    totalDeduction: { type: String, default: 0 },
    grandTotalCTCWithDeduction: { type: String, default: 0 },
    grandTotalCTCWithDeductionYearly: {
      type: String,
      default: 0,
    },
    lastUpdatedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to User model
      required: true,
    },
    status: {
      type: String,
      enum: ["Initial", "Correction"],
      default: "Initial",
    },
    statusById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to User model
      required: true,
    },
    payStatus: { type: String, enum: ["Unpaid", "Paid"], default: "Unpaid" }, // ← Added
    payStatusById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to User model
    },
    isFrozen: { type: String, enum: ["Yes", "No"], default: "No" }, // ← Added
    isFrozenById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to User model
    },
    attendanceData: {
      type: mongoose.Schema.Types.Mixed, // Can be Number or [Number]
      required: true,
    },

    totalLeaveDeductionDays: { type: String, default: 0 },
    earnCompOffDays: { type: String, default: 0 },
    earnEncashLeave: { type: String, default: 0 },
    earnLWP: { type: String, default: 0 },

    earnCompOffDaysAmount: { type: String, default: 0 },
    earnEncashLeaveAmount: { type: String, default: 0 },
    earnLWPAmount: { type: String, default: 0 },
    earnTotalPay: { type: String, default: 0 },

    earnfinalBasic: { type: String, default: 0 },
    earnhra: { type: String, default: 0 },
    earnotherAllowance: { type: String, default: 0 },
    earngrossSalary: { type: String, default: 0, required: true },
    earnactualBasicSalary: { type: String, default: 0 },
    earnpfMinBasicSalary: { type: String, default: 0 },
    earnesicMinGrossSalary: { type: String, default: 0 },
    earnepfp: { type: String, default: 0 }, // employer pf percentage
    earnepf: { type: String, default: 0 }, // employer pf
    earnesic: { type: String, default: 0 }, // employer esic
    earnesicp: { type: String, default: 0 }, // employer esic percentage
    earntotalCTC: { type: String, required: true, default: 0 },

    earnemppfp: { type: String, default: 0 }, // employer pf percentage
    earnemppf: { type: String, default: 0 }, // employer pf
    earnempesicp: { type: String, default: 0 }, // employer esic percentage
    earnempesic: { type: String, default: 0 }, // employer esic

    earnIncentiveAmount: { type: String, default: 0 },
    earnTotalPayWithIncentive: { type: String, default: 0 },

    earnempptDeduction: { type: String, default: 0 },
    earnempTDSDeduction: { type: String, default: 0 },
    earnempwelfareDeduction: { type: String, default: 0 },
    earnempotherDeduction: { type: String, default: 0 },
    earnempTotalDeduction: { type: String, default: 0 },

    earnNetPay: { type: String, default: 0 },

    earnReimbursementAmount: { type: String, default: 0 },
    earnOtherAmount: { type: String, default: 0 },

    earnFinalNetPay: { type: String, default: 0 },
    remarks: { type: String, default: null },
    ctcStatus: { type: Boolean, required: true, default: true },
    proccessArr: [],
    activeFlag: { type: Number, required: true, default: 1 },
    deleteFlag: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);


module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.MonthlyProccess) {
    return dbConnection.models.MonthlyProccess;
  }
  return dbConnection.model("MonthlyProccess", MonthlyProccessSchema);
};