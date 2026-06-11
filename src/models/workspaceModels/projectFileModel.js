const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const ProjectFileSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    title: { type: String, required: true },
    file: { type: String, required: true },
    fileType: { type: String, default: null },
    fileSize: { type: String, default: null },
    notifyIds: [
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
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    privacyPeopleIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    message: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
  if (dbConnection.models.ProjectFile) {
    return dbConnection.models.ProjectFile;
  }
  return dbConnection.model("ProjectFile", ProjectFileSchema);
};
