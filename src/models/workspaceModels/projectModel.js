const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const ProjectSchema = new mongoose.Schema(
  {
    projectNumber: {
      type: String,
      unique: true,
      required: true,
    },
    name: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow",
      default: null,
    },
    peopleIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    ],
    projectCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectCategory",
      default: null,
    },
    projectSubCategoryId: {
      type: mongoose.Schema.Types.ObjectId, // _id from embedded subCategory
      default: null,
    },
    tagIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Tags", default: null },
    ],
    isBillable: { type: Boolean, default: true },
    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    projectHealthLabels: {
      color: { type: String, default: "#808080" },
      text: { type: String, default: "Not set" },
    },
    favorite: { type: Boolean, default: false },
    notifyIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    ],
    projectStartDate: { type: Date, default: null },
    projectEndDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["Active", "Completed", "On Hold", "Archived"],
      default: "Active",
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
  if (dbConnection.models.Project) {
    return dbConnection.models.Project;
  }
  return dbConnection.model("Project", ProjectSchema);
};
