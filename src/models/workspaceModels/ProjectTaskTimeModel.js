// models/ProjectTaskTime.js
const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const IntervalSchema = new mongoose.Schema(
  {
    from: { type: Date, required: true },
    to: { type: Date, default: null },
    duration: { type: Number, default: 0 }, // seconds
  },
  { _id: false }
);

const ActionSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    status: {
      type: String,
      enum: [
        "CREATED",
        "EDITED",
        "SUBMITTED",
        "APPROVED",
        "REJECTED",
        "AUDITED",
        "INVOICED",
        "LOCKED",
      ],
      required: true,
      default: "CREATED",
    },
    oldValue: { type: Object, default: null },
    newValue: { type: Object, default: null },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    at: { type: Date, default: Date.now },
    reason: { type: String, default: "" },
  },
  { _id: false }
);

const ProjectTaskTimeSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    taskListId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectTaskList",
      required: true,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectTask",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // overall entry-level times
    startedAt: { type: Date, default: null },
    stoppedAt: { type: Date, default: null },

    // running state
    lastStartedAt: { type: Date, default: null },
    running: { type: Boolean, default: false, index: true },

    // intervals
    intervals: { type: [IntervalSchema], default: [] },

    // computed
    totalDuration: { type: Number, default: 0 }, // seconds

    // meta
    description: { type: String, trim: true, maxlength: 500, default: "" },
    source: {
      type: String,
      enum: ["TIMER", "MANUAL", "IMPORT"],
      default: "TIMER",
    },

    billable: { type: Boolean, default: false, index: true },
    hourlyRate: { type: Number, default: 0 },

    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tags" }],
    attachments: { type: Array, default: [] },

    // status & approvals
    status: {
      type: String,
      enum: [
        "CREATED",
        "EDITED",
        "SUBMITTED",
        "APPROVED",
        "REJECTED",
        "AUDITED",
        "INVOICED",
        "LOCKED",
      ],
      default: "CREATED",
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: { type: Date, default: null },

    invoiced: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },

    // audit / misc
    editedCount: { type: Number, default: 0 },
    actions: { type: [ActionSchema], default: [] },

    // system flags
    activeFlag: { type: Number, enum: [0, 1], default: 1 },
    deleteFlag: { type: Number, enum: [0, 1], default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

/* ---------- Helpers ---------- */

function recalcTotal(intervals) {
  let total = 0;
  if (!Array.isArray(intervals)) return 0;
  for (const it of intervals) {
    if (typeof it.duration === "number" && it.duration > 0)
      total += it.duration;
    else if (it.from && it.to)
      total += Math.max(
        0,
        Math.floor((new Date(it.to) - new Date(it.from)) / 1000)
      );
  }
  return total;
}

function snapshotForAction(doc) {
  if (!doc) return null;
  return {
    intervals: (doc.intervals || []).map((i) => ({
      from: i.from ? i.from.toISOString() : null,
      to: i.to ? i.to.toISOString() : null,
      duration: i.duration,
    })),
    totalDuration: doc.totalDuration || 0,
    billable: !!doc.billable,
    hourlyRate: doc.hourlyRate || 0,
    status: doc.status || null,
    running: !!doc.running,
  };
}

/* Ensure running flag and lastStartedAt / intervals consistent */
ProjectTaskTimeSchema.pre("validate", function (next) {
  try {
    const hasOpen =
      Array.isArray(this.intervals) &&
      this.intervals.some((i) => i.to === null);
    if (this.running && !hasOpen) {
      const from = this.lastStartedAt || new Date();
      this.intervals = this.intervals || [];
      this.intervals.push({ from, to: null, duration: 0 });
      this.lastStartedAt = from;
      if (!this.startedAt) this.startedAt = from;
    }
    if (!this.running && hasOpen) {
      this.running = true;
      const lastOpen = this.intervals
        .slice()
        .reverse()
        .find((i) => i.to === null);
      if (lastOpen) this.lastStartedAt = lastOpen.from;
      if (!this.startedAt && lastOpen && lastOpen.from)
        this.startedAt = lastOpen.from;
    }
    next();
  } catch (err) {
    next(err);
  }
});

/* Recalc totalDuration before save and sync started/stopped */
ProjectTaskTimeSchema.pre("save", function (next) {
  try {
    this.totalDuration = recalcTotal(this.intervals);
    if (Array.isArray(this.intervals) && this.intervals.length > 0) {
      const first = this.intervals[0];
      if (first && first.from) this.startedAt = this.startedAt || first.from;
      const last = this.intervals
        .slice()
        .reverse()
        .find((i) => i.to !== null);
      if (last && last.to) this.stoppedAt = last.to;
    } else {
      this.startedAt = this.startedAt || null;
      this.stoppedAt = this.stoppedAt || null;
    }

    const open = (this.intervals || [])
      .slice()
      .reverse()
      .find((i) => i.to === null);
    if (open) this.lastStartedAt = open.from;
    else this.lastStartedAt = null;

    next();
  } catch (err) {
    next(err);
  }
});

/* Instance methods */
ProjectTaskTimeSchema.methods.startInterval = function (fromDate) {
  if (this.locked || this.invoiced || this.deleteFlag === 1)
    throw new Error("Cannot modify locked/invoiced/deleted log");
  const hasOpen = (this.intervals || []).some((i) => i.to === null);
  if (hasOpen) return this;
  const from = fromDate || new Date();
  this.intervals = this.intervals || [];
  this.intervals.push({ from, to: null, duration: 0 });
  this.running = true;
  this.lastStartedAt = from;
  if (!this.startedAt) this.startedAt = from;
  this.status = "EDITED";
  return this;
};

ProjectTaskTimeSchema.methods.stopInterval = function (toDate) {
  if (this.locked || this.invoiced || this.deleteFlag === 1)
    throw new Error("Cannot modify locked/invoiced/deleted log");
  const idx = (this.intervals || [])
    .map((it, i) => ({ it, i }))
    .reverse()
    .find((x) => x.it.to === null);
  if (!idx) throw new Error("No running interval");
  const realIdx = idx.i;
  const to = toDate || new Date();
  this.intervals[realIdx].to = to;
  this.intervals[realIdx].duration = Math.max(
    0,
    Math.floor((new Date(to) - new Date(this.intervals[realIdx].from)) / 1000)
  );
  this.totalDuration = recalcTotal(this.intervals);
  this.running = false;
  this.lastStartedAt = null;
  this.stoppedAt = to;
  this.status = "EDITED";
  return this;
};

ProjectTaskTimeSchema.methods.addManualInterval = function (fromDate, toDate) {
  if (this.locked || this.invoiced || this.deleteFlag === 1)
    throw new Error("Cannot modify locked/invoiced/deleted log");
  const from = new Date(fromDate);
  const to = new Date(toDate);
  if (isNaN(from.getTime()) || isNaN(to.getTime()) || to <= from)
    throw new Error("Invalid from/to");
  const duration = Math.max(0, Math.floor((to - from) / 1000));
  this.intervals = this.intervals || [];
  this.intervals.push({ from, to, duration });
  this.totalDuration = recalcTotal(this.intervals);
  this.status = "EDITED";
  if (!this.startedAt) this.startedAt = from;
  this.stoppedAt = to;
  return this;
};

/* Indexes tuned for typical queries */
ProjectTaskTimeSchema.index({ userId: 1, running: 1 });
ProjectTaskTimeSchema.index({ projectId: 1, userId: 1, createdAt: -1 });
ProjectTaskTimeSchema.index({ status: 1, billable: 1 });

/* Export factory (multi-tenant pattern) */
module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.ProjectTaskTime)
    return dbConnection.models.ProjectTaskTime;
  return dbConnection.model("ProjectTaskTime", ProjectTaskTimeSchema);
};

// const mongoose = require("mongoose");
// const SITE_DB = require("../../configs/sitedbConfig");

// const ProjectTaskTimeSchema = new mongoose.Schema(
//   {
//     projectId: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//       ref: "Project",
//       index: true,
//     },
//     taskListId: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//       ref: "ProjectTaskList",
//       index: true,
//     },
//     taskId: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//       ref: "ProjectTask",
//       index: true,
//     },
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//       ref: "User",
//       index: true,
//     },
//     lastStartedAt: {
//       type: Date,
//       default: null,
//     },
//     description: {
//       type: String,
//       trim: true,
//       maxlength: 500,
//       default: "",
//     },
//     intervals: [
//       {
//         from: {
//           type: Date,
//           required: true,
//         },
//         to: {
//           type: Date,
//           default: null,
//         },
//         duration: {
//           type: Number,
//           default: 0,
//         },
//       },
//     ],
//     totalDuration: {
//       type: Number,
//       default: 0,
//     },
//     billable: {
//       type: Boolean,
//       default: false,
//       index: true,
//     },
//     hourlyRate: {
//       type: Number,
//       default: 0,
//     },
//     tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tags" }],
//     attachments: [],
//     status: {
//       type: String,
//       enum: [
//         "CREATED",
//         "EDITED",
//         "SUBMITTED",
//         "APPROVED",
//         "REJECTED",
//         "AUDITED",
//         "INVOICED",
//         "LOCKED",
//       ],
//       default: "CREATED",
//     },
//     running: {
//       type: Boolean,
//       default: false,
//       index: true,
//     },
//     invoiced: {
//       type: Boolean,
//       default: false,
//     },
//     locked: {
//       type: Boolean,
//       default: false,
//     },
//     actions: [
//       {
//         status: {
//           type: String,
//           enum: [
//             "CREATED",
//             "EDITED",
//             "SUBMITTED",
//             "APPROVED",
//             "REJECTED",
//             "AUDITED",
//             "INVOICED",
//             "LOCKED",
//           ],
//           default: "CREATED",
//         },
//         oldValue: {
//           type: Object,
//           default: null,
//         },
//         by: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "User",
//           required: true,
//         },
//         at: { type: Date, default: Date.now },
//         reason: { type: String, default: "" },
//       },
//     ],
//     activeFlag: {
//       type: Number,
//       enum: [0, 1],
//       default: 1,
//     },
//     deleteFlag: {
//       type: Number,
//       enum: [0, 1],
//       default: 0,
//     },
//   },
//   { timestamps: true }
// );

// module.exports = async (DB_NAME) => {
//   const dbConnection = await SITE_DB(DB_NAME);
//   if (dbConnection.models.ProjectTaskTime) {
//     return dbConnection.models.ProjectTaskTime;
//   }
//   return dbConnection.model("ProjectTaskTime", ProjectTaskTimeSchema);
// };
