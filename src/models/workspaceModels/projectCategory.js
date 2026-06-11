const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const ProjectCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    subCategory: [
      {
        name: { type: String, required: true },
        description: { type: String, trim: true, default: null },
        activeFlag: { type: Number, default: 1 },
        deleteFlag: { type: Number, default: 0 },
      },
    ],
    activeFlag: { type: Number, default: 1 },
    deleteFlag: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.ProjectCategory) {
    return dbConnection.models.ProjectCategory;
  }
  return dbConnection.model("ProjectCategory", ProjectCategorySchema);
};
