const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const CompanySchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    tagsId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tags",
      },
    ],
    companyNumber: {
      type: String,
      unique: true,
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    companyType: { type: Boolean, default: false },
    companyName: { type: String, required: true, trim: true },
    companyURL: { type: String, default: null },
    companyEmail: { type: String, default: null },
    companyPhone: { type: String, default: null },
    companyLogo: { type: String, default: null },
    companyLandmark: { type: String, default: null },
    companyAddress: { type: String, default: null },
    companyCity: { type: String, default: null },
    companyState: { type: String, default: null },
    companyCode: { type: String, default: null },
    companycountryName: { type: String, default: "India" },
    companycountryId: { type: String, default: null },
    companyCountryCode: { type: String, default: null },
    companyPincode: { type: String },
    companyPrivateNotes: { type: String, default: null },
    companyPublicProfile: { type: String, default: null },
    industry: { type: String, default: null },
    companyHealthLabels: {
      color: { type: String, default: "#808080" },
      text: { type: String, default: "Not set" },
    },

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
  },
  { timestamps: true }
);

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.Company) {
    return dbConnection.models.Company;
  }
  return dbConnection.model("Company", CompanySchema);
};
