const mongoose = require("mongoose");

const AuthKeysSchema = new mongoose.Schema(
  {
    // mail keys
    MAIL_HOST: { type: String, required: true },
    MAIL_PORT: { type: String, required: true },
    MAIL_USERNAME: { type: String, required: true },
    MAIL_PASSWORD: { type: String, required: true },
    MAIL_SMTPSECURE: { type: String, required: true },
    // s3 keys
    accessKeyId: { type: String, required: true },
    secretAccessKey: { type: String, required: true },
    bucketName: { type: String, required: true },
    activeFlag: { type: Number, default: 1, enum: [0, 1] },
    deleteFlag: { type: Number, default: 0, enum: [0, 1] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuthKeys", AuthKeysSchema);
 
