const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const InvoiceSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Client",
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    totalHours: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["DRAFT", "SENT", "PAID", "LOCKED"],
      default: "DRAFT",
    },
    timeLogs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProjectTaskTime",
        required: true,
      },
    ],
    actions: [
      {
        status: {
          type: String,
          enum: ["DRAFT", "SENT", "PAID", "LOCKED"],
          required: true,
        },
        by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        at: { type: Date, default: Date.now },
        reason: { type: String, default: "" },
      },
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
  },
  { timestamps: true }
);

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.Invoice) {
    return dbConnection.models.Invoice;
  }
  return dbConnection.model("Invoice", InvoiceSchema);
};
