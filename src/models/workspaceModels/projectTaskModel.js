const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const ReminderSchema = new mongoose.Schema({
  date: { type: Date, default: null }, // pura date-time yahan store karo
  userIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  ],
  description: { type: String, default: "" },
  type: {
    type: String,
    enum: ["email", "notification", "mobile"],
    default: "email",
  },
});

const ProjectTaskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    taskListId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectTaskList",
      required: true,
    },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    parentTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectTask",
      default: null,
    },
    taskNumber: {
      type: String,
      unique: true,
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String, default: null },
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow",
      default: null,
    },
    stageId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    priority: {
      type: String,
      enum: ["none", "low", "medium", "high"],
      default: "none",
    },
    taskStatus: {
      type: String,
      enum: ["not started", "incompleted", "completed", "rejected"],
      default: "not started",
    },

    orderIndex: {
      type: Number,
      default: 0,
      index: true,
    },
    progress: { type: Number, default: 0 }, // 0–100%

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    tags: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Tags", default: null },
    ],

    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    estimateMinutes: { type: Number, default: 0 }, // planned time
    isBillable: { type: Boolean, default: true },
    invoiced: { type: Boolean, default: false },
    files: [],
    reminders: [ReminderSchema],
    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    activeFlag: {
      type: Number,
      enum: [0, 1],
      default: 1,
    },
    deleteFlag: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.ProjectTask) {
    return dbConnection.models.ProjectTask;
  }
  return dbConnection.model("ProjectTask", ProjectTaskSchema);
};
