const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const DeviceSyncCommandSchema = new mongoose.Schema({
  deviceSN: {
    type: String,
    required: true,
    unique: true,
  },
  fromDate: {
    type: Date,
    required: true,
  },
  toDate: {
    type: Date,
    required: true,
  },
  commandSent: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.DeviceSyncCommand) {
    return dbConnection.models.DeviceSyncCommand;
  }
  return dbConnection.model("DeviceSyncCommand", DeviceSyncCommandSchema);
};