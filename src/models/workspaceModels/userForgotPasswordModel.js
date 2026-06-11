const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const UserForgotPasswordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mobileNumber: {
      type: Number,
    },
    email: {
      type: String,
      required: false,
      match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
    },
    otp: {
      type: Number,
      required: true,
    },
    otpVerify: {
      type: Number,
      required: true,
      enum: [0, 1],
      default: 0,
    },
    roleName: {
      type: String,
      required: true,
    },
    forgotPassIdentity: {
      type: String,
      required: false,
    },
    expireIn: {
      type: Date,
      required: true,
    },
    activeFlag: {
      type: Number,
      required: true,
      enum: [0, 1],
      default: 1,
    },
    deleteFlag: {
      type: Number,
      required: true,
      enum: [0, 1],
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.UserForgotPassword) {
    return dbConnection.models.UserForgotPassword;
  }
  return dbConnection.model("UserForgotPassword", UserForgotPasswordSchema);
};
