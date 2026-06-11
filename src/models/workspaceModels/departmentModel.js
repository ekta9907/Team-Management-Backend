const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const DepartmentSchema = new mongoose.Schema(
  {
    departmentName: { type: String, required: true },
    activeFlag: { type: Number, default: 1 },
    deleteFlag: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.Department) {
    return dbConnection.models.Department;
  }
  return dbConnection.model("Department", DepartmentSchema);
};
