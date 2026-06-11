const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema(
  {
    deviceName: {
      type: String,
      required: true,
      trim: true,
    },
    deviceModelId: {
      type: String,
      required: true,
      trim: true,
    },
    deviceSerialNumber: {
      type: String,
      required: true,
      unique: true, // Optional: ensures no duplicates
      trim: true,
    },
    deviceModelName: {
      type: String,
      required: true,
      trim: true,
    },
    deviceModelNumber: {
      type: String,
      required: true,
      trim: true,
    },
    deviceAddress: {
      type: String,
      required: true,
      trim: true,
    },
    deviceIPAddress: {
      type: String,
      required: true,
      trim: true,
      match: [/^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/, "Invalid IP address"],
    },
    activeFlag: {
      type: Number,
      default: 1,
      enum: [0, 1], // 1 = active, 0 = inactive
    },
    deleteFlag: {
      type: Number,
      default: 0,
      enum: [0, 1], // 1 = deleted, 0 = not deleted
    },
    lastActive: {
      type: Date,
      default: new Date(),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Device", DeviceSchema);