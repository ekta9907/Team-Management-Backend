const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const EmployeeSchema = new mongoose.Schema(
  {
    EmployeeId: { type: Number, required: true, unique: true },
    EmployeeName: {
      type: String,
      trim: true,
    },
    EmployeeCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    StringCode: {
      type: String,
      trim: true,
    },
    NumericCode: {
      type: Number,
      required: true,
    },
    Status: {
      type: String,
      default: "Working",
    },
    EmployeePhoto: {
      type: String, // Store photo URL or base64 string
      default: "",
    },
    activeFlag: { type: Number, default: 1 },
    deleteFlag: { type: Number, default: 0 },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Export the model
module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.Employee) {
    return dbConnection.models.Employee;
  }
  return dbConnection.model("Employee", EmployeeSchema);
};