const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const CTCStructurePercentageSchema = new mongoose.Schema(
  {
    basicSalaryCTCPercentage: {
      type: Number,
      required: true,
      default: 50,
    },
    HRABasicSalaryPercentage: {
      type: Number,
      required: true,
      default: 40,
    },
    pfMinBasicSalary: {
      type: Number,
      required: true,
      default: 15000,
    },
    esicMinSalary: {
      type: Number,
      required: true,
      default: 21000,
    },
    grossMinPercentageForBasicPf: {
      type: Number,
      required: true,
      default: 80,
    },
    epfEmployerPfMinBasicSalaryPercentage: {
      type: Number,
      required: true,
      default: 13,
    },
    pfEmployeePfMinBasicSalaryPercentage: {
      type: Number,
      required: true,
      default: 12,
    },
    esicEmployerGrossPercentage: {
      type: Number,
      required: true,
      default: 3.25,
    },
    esicEmployeeGrossPercentage: {
      type: Number,
      required: true,
      default: 0.75,
    },
    otherDeduction: {
      type: Number,
      default: 0,
    },
    otherTDS: {
      type: Number,
      default: 0,
    },
    ptDeductionYearly: [],
    ptDeduction: { type: mongoose.Schema.Types.Mixed },
    welfareDeduction: [
      {
        month: Number,
        amount: Number,
      },
    ],
    taxTDSYearly: [],
    taxTDS: { type: mongoose.Schema.Types.Mixed },
    activeFlag: {
      type: Number,
      default: 0,
      enum: [0, 1],
    },
    deleteFlag: {
      type: Number,
      default: 0,
      enum: [0, 1],
    },
  },
  { timestamps: true }
);

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.CTCSP) {
    return dbConnection.models.CTCSP;
  }
  return dbConnection.model("CTCSP", CTCStructurePercentageSchema);
};