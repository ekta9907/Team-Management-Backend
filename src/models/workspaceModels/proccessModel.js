const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const ProccessSchema = new mongoose.Schema(
  {
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to User model
      required: true,
    },
    unitIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Unit" }],
    unitName: { type: String, required: true },
    roleName: { type: String, required: true },
    designationName: { type: String, required: true },
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
    emppfp: { type: String, default: 0 },
    emppf: { type: String, default: 0 },
    empesicp: { type: String, default: 0 },
    empesic: { type: String, default: 0 },
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
    status: {
      type: String,
      enum: ["Pending", "New-Hire", "Correction", "Increment"],
      default: "Pending",
    },
    remarks: { type: String, default: null },
    activeFlag: { type: Number, required: true, default: 1 },
    deleteFlag: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);


module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.Proccess) {
    return dbConnection.models.Proccess;
  }
  return dbConnection.model("Proccess", ProccessSchema);
};