const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const RoleSchema = new mongoose.Schema(
  {
    roleName: { type: String, required: true },
    activeFlag: { type: Number, default: 1 },
    deleteFlag: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.Role) {
    return dbConnection.models.Role;
  }
  return dbConnection.model("Role", RoleSchema);
};
