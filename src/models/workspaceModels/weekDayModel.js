const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const WeekDaySchema = new mongoose.Schema(
  {
    weekDayName: {
      type: String,
      required: true,
      default: ["Monday"],
    },
    deleteFlag: {
      type: Number,
      default: 0,
      enum: [0, 1],
    },
  },
  { timestamps: true }
);

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.WeekDay) {
    return dbConnection.models.WeekDay;
  }
  return dbConnection.model("WeekDay", WeekDaySchema);
};
