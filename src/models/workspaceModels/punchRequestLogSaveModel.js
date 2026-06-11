const mongoose = require("mongoose");

const RequestLogSaveAllPunchGetSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true, // or false if optional
  },
  body: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  query: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("RequestLogSaveAllPunchGet", RequestLogSaveAllPunchGetSchema);
