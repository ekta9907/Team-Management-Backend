const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const ProjectBudgetSchema = new mongoose.Schema(
  {
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    budgetName: {
      type: String,
      required: true,
      trim: true,
    },
    budgetType: {
      type: String,
      enum: ["no_budget", "fixed_fee", "time_materials", "retainer"],
      default: "no_budget",
    },
    budgetAmountType: {
      type: String,
      enum: ["never", "financial", "time"],
      default: "never",
    },
    budgetAmount: {
      type: Number,
      default: null,
    },
    budgetRepeats: {
      type: String,
      enum: [
        "never",
        "every_1_week",
        "every_2_week",
        "every_1_month",
        "every_3_month",
        "every_6_month",
        "every_12_month",
      ],
      default: "never",
    },
    budgetStartDate: {
      type: Date,
      default: null,
    },
    budgetEndDate: {
      type: Date,
      default: null,
    },
    budgetBasedOn: {
      type: String,
      enum: ["never", "all_time", "billable_time", "non_billable_time"],
      default: "never",
    },
    retainerOption: {
      enabled: { type: Boolean, default: false }, // main toggle
      addUnspentToNext: { type: Boolean, default: false },
      subtractOverspentFromNext: { type: Boolean, default: false },
    },
    financialTarget: {
      enabled: { type: Boolean, default: false }, // main toggle
      profitMargin: { type: Number, default: 0 },
      targetProfit: { type: Number, default: 0 },
      targetCosts: { type: Number, default: 0 },
    },
    activeFlag: {
      type: Boolean,
      default: true,
    },
    deleteFlag: {
      type: Boolean,
      default: false,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.ProjectBudget) {
    return dbConnection.models.ProjectBudget;
  }
  return dbConnection.model("ProjectBudget", ProjectBudgetSchema);
};
