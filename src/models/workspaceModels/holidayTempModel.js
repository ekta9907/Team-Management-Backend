const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const HolidayTempSchema = new mongoose.Schema(
  {
    holidayName: { type: String, required: true },
    date: { type: Date, required: true },
    image: { type: String, default: null },
    compOff: {
      type: String,
      default: 'NO',
      enum: ['Comp-Off','NO'], // 1 = deleted, 0 = not deleted
    },
    activeFlag: { type: Number, default: 1 },
    deleteFlag: { type: Number, default: 0 },
  },
  { timestamps: true }
);



module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.HolidayTemp) {
    return dbConnection.models.HolidayTemp;
  }
  return dbConnection.model("HolidayTemp", HolidayTempSchema);
};