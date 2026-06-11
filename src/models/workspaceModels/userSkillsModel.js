const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const UserSkillsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
    },
    activeFlag: { type: Number, default: 1 },
    deleteFlag: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.UserSkills) {
    return dbConnection.models.UserSkills;
  }
  return dbConnection.model("UserSkills", UserSkillsSchema);
};
