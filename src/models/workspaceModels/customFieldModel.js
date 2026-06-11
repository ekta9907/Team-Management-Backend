const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const customFieldSchema = new mongoose.Schema(
  {
    moduleType: {
      type: String,
      enum: ["Project", "Task", "Company"],
      required: true,
    },
    fieldName: { type: String, required: true },
    value: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    keyName: { type: String, required: true }, // e.g., "clientName"
    fieldType: {
      type: String,
      enum: ["text", "number", "date", "checkbox", "url", "status", "dropdown"],
      default: "text",
    },
    options: {
      type: [
        {
          label: { type: String, required: true },
          value: { type: String, required: true },
          isDefault: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    description: {
      type: String,
      default: null,
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
  },
  { timestamps: true }
);

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.CustomField) {
    return dbConnection.models.CustomField;
  }
  return dbConnection.model("CustomField", customFieldSchema);
};
