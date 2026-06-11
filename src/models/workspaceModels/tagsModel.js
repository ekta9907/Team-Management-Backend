const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const TagsSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    color: { type: String, default: "#000000" },
    activeFlag: { type: Number, default: 1 },
    deleteFlag: { type: Number, default: 0 },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.Tags) {
    return dbConnection.models.Tags;
  }
  return dbConnection.model("Tags", TagsSchema);
};
