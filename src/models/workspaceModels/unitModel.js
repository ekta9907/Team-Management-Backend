const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const UnitSchema = new mongoose.Schema(
  {
    unitName: { type: String, required: true },
    unitEmail: { type: String, default: null },
    unitURL: { type: String, default: null },
    unitAddress: { type: String, default: null },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    activeFlag: { type: Number, default: 1 },
    deleteFlag: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.Unit) {
    return dbConnection.models.Unit;
  }
  return dbConnection.model("Unit", UnitSchema);
};
