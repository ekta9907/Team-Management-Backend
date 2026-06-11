const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const punchSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  timeString: { type: String, required: true },
  time: { type: Date, required: true },
  type: { type: String, enum: ["IN", "OUT", "POSIN", "POSOUT"], required: true },
  image: { type: String, default: "" },
  address: { type: String, default: "" },
  latitude: { type: String, default: "" },
  longitude: { type: String, default: "" },
  serialNumber: { type: String, default: "" },
});

const AttendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    uniqueId: { type: String, required: true },
    shiftStart: { type: String, default: "00:00" },
    shiftEnd: { type: String, default: "00:00" },
    shiftDuration: { type: Number, default: 0 },
    shiftBreakDuration: { type: Number, default: 0 },
    shiftReligiousBreakDuration: { type: Number, default: 0 },
    date: { type: Date, required: true },
    punches: [punchSchema],
    firstIn: { type: String, default: null },
    firstInStatus: { type: Number, default: 0, enum: [0, 1] },
    lastOut: { type: String, default: null },
    lastOutStatus: { type: Number, default: 0, enum: [0, 1] },
    totalWorkingHrs: { type: String, default: "00:00" },
    totalWorkingMin: { type: Number, default: 0 },
    workingHrs: { type: String, default: "00:00" },
    workingMin: { type: Number, default: 0 },
    breakDuration: { type: Number, default: 0 },
    lateBy: { type: Number, default: 0 },
    overTime: { type: Number, default: 0 },
    status: { type: String, enum: ["Present", "Absent"], default: "Present" },
    presentStatus: { type: String, enum: ["Present", "Absent", "No"], default: "No" },
    leaveStatus: { type: String, enum: ["Present", "Absent", "No"], default: "No" },
    leaveType: { type: String, enum: ["Unplanned", "Planned", "Sick", "Sick", "Paid", "Maternity", "Paternity", "No"], default: "No" },

    religiousBreakDuration: { type: Number, default: 0 },
    religiousBreakStatus: { type: Number, default: 0 },
    shortLoginHDStatus: { type: Number, default: 0, enum: [0, 1] },
    activeFlag: { type: Number, default: 1 },
    deleteFlag: { type: Number, default: 0 },
    takenBreak: { type: Number, default: 0 },
    lateByEarly: { type: Number, default: 0 },
    unitName: { type: String, default: null },
    atMonth: { type: String, default: null },
    mailSend: { type: Number, default: 0, enum: [0, 1] },
  },
  { timestamps: true }
);
AttendanceSchema.index({ userId: 1, date: 1, uniqueId: 1, deleteFlag: 1 }, { unique: true });
module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.Attendance) {
    return dbConnection.models.Attendance;
  }
  return dbConnection.model("Attendance", AttendanceSchema);
};
