const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const PunchRecordSchema = new mongoose.Schema({
  punchesRecord: [
    {
      month: { type: String, required: true }, // YYYYMM format (e.g., 202503)
      punches: [],
      lastRecordId: { type: Number, required: true, default: 0 }, // Last punch ID for this month
    },
  ],
  lastGlobalRecordId: { type: Number, required: true, default: 0 }, // Last punch ID globally
});

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.PunchRecord) {
    return dbConnection.models.PunchRecord;
  }
  return dbConnection.model("PunchRecord", PunchRecordSchema);
};
