const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const PunchLogSchema = new mongoose.Schema(
  {
    uniqueId: { type: String, required: true },
    punchDate: { type: Date, required: true },
    punchDateString: { type: String, required: true },
    table: { type: String },
    serialNumber: { type: String, required: true },
    deviceId: { type: String, required: true },
    punchType: { type: String, required: true },
    rawData: { type: [], required: true },
    response: { type: mongoose.Schema.Types.Mixed, default: null }, // Store API response
    status: { type: Boolean, default: null }, // Store API success/failure status
  },
  { timestamps: true }
);

module.exports = mongoose.model("PunchLog", PunchLogSchema);
