const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const ProjectMessageSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectCategory",
      default: null,
    },
    projectSubCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    privacyPeopleIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    notifyIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    ],
    files: [],
    tagIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Tags", default: null },
    ],
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
  if (dbConnection.models.ProjectMessage) {
    return dbConnection.models.ProjectMessage;
  }
  return dbConnection.model("ProjectMessage", ProjectMessageSchema);
};
