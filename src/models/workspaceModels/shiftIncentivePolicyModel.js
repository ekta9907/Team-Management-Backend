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

const ShiftIncentivePolicySchema = new mongoose.Schema(
  {
    incentivePolicyId: { type: mongoose.Schema.Types.ObjectId, ref: "IncentivePolicy" },
    shiftId: { type: mongoose.Schema.Types.ObjectId, ref: "Shift" },
    fulllable: { type: String, required: true },
    lable: { type: String, required: true },
    levelName: { type: String, required: true },
    description: { type: String, default: null },
    document: { type: String, default: null },
    incentive: { type: [ShiftIncentiveSchema], default: [] },
    activeFlag: { type: Number, default: 1 },
    deleteFlag: { type: Number, default: 0 },
  },
  { timestamps: true }
);


module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.ShiftIncentivePolicy) {
    return dbConnection.models.ShiftIncentivePolicy;
  }
  return dbConnection.model("ShiftIncentivePolicy", ShiftIncentivePolicySchema);
};
