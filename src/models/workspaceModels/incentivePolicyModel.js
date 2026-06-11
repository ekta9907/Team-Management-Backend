const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const SubConditionSchema = new mongoose.Schema(
  {
    target: { type: Number, required: true },
    value: { type: Number, required: true },
  },
  { _id: false }
);

const IncentiveSchema = new mongoose.Schema(
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
      type: [SubConditionSchema],
      default: undefined,
    },
    activeFlag: { type: Number, default: 1 },
    select: { type: Boolean, default: false },
  },
  { _id: false }
);

const PolicySchema = new mongoose.Schema(
  {
    fulllable: { type: String, required: true },
    lable: { type: String, required: true },
    levelName: { type: String, required: true },
    activeFlag: { type: Number, default: 1 },
    deleteFlag: { type: Number, default: 0 },
    description: { type: String, default: null },
    document: { type: String, default: null },
    incentive: { type: [IncentiveSchema], default: [] },
  },
  { timestamps: true }
);


module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.IncentivePolicy) {
    return dbConnection.models.IncentivePolicy;
  }
  return dbConnection.model("IncentivePolicy", PolicySchema);
};