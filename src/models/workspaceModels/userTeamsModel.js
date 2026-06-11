const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const UserTeamsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    activeFlag: { type: Number, default: 1 },
    deleteFlag: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.UserTeams) {
    return dbConnection.models.UserTeams;
  }
  return dbConnection.model("UserTeams", UserTeamsSchema);
};
