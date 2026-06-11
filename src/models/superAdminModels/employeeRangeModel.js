const mongoose = require("mongoose");

const employeeRangeSchema = new mongoose.Schema(
  {
    start: {
      type: Number,
      required: true,
    },
    end: {
      type: Number,
      required: true,
    },
    activeFlag: { type: Number, default: 1, enum: [0, 1] },
    deleteFlag: { type: Number, default: 0, enum: [0, 1] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmployeeRange", employeeRangeSchema);
