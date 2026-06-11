const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const TeamSchema = new mongoose.Schema(
  {
    teamName: { type: String, required: true },
    teamLogo: { type: String, default: null },
    handleBy: { type: String, default: null },
    description: { type: String, default: null },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      required: false,
    },
    activeFlag: { type: Number, default: 1 },
    deleteFlag: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.Team) {
    return dbConnection.models.Team;
  }
  return dbConnection.model("Team", TeamSchema);
};
