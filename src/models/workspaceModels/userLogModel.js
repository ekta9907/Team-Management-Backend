const mongoose = require("mongoose");

const UserLogSchema = new mongoose.Schema(
  {
    rawData: { type: [], required: true },
    rawDataFormated: { type: mongoose.Schema.Types.Mixed, default: null }, // Store API response
  },
  { timestamps: true }
);


module.exports = mongoose.model("UserLog", UserLogSchema);
