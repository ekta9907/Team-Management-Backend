require("dotenv").config();
const mongoose = require("mongoose");
const AuthKeys = require("../models/superAdminModels/authKeysModel");
const fs = require("fs");

let MAIL_HOST = "";
let MAIL_PORT = "";
let MAIL_USERNAME = "";
let MAIL_PASSWORD = "";
let MAIL_SMTPSECURE = "";
let accessKeyId = "";
let secretAccessKey = "";
let bucketName = "bw-project-management";


const db_status =
  process.env.NODE_ENV === "development" ? "development" : "production";
mongoose
  .connect(
    db_status === "production" ? process.env.DB_URL_PROD : process.env.DB_URL
  )
  .then(async () => {
    if (db_status === "production") {
     try {
       // mail keys
       const smtpJson = fs.readFileSync(
         "/var/my-bw-auth/ses_smtp_config.json",
         "utf8"
       );
       const smtpConfig = JSON.parse(smtpJson);
       MAIL_HOST = smtpConfig?.host || "";
       MAIL_PORT = smtpConfig?.port || "";
       MAIL_USERNAME = smtpConfig?.username || "";
       MAIL_PASSWORD = smtpConfig?.password || "";
       MAIL_SMTPSECURE = smtpConfig?.smtp_crypto || "";
     } catch (err) {
       console.warn("SMTP config read error:", err.message);
     }

     try {
       // s3 keys
       const s3Json = fs.readFileSync("/var/my-bw-auth/key.json", "utf8");
       const s3Config = JSON.parse(s3Json);
       accessKeyId = s3Config?.website_s3_access_id || "";
       secretAccessKey = s3Config?.website_s3_secret_key || "";
     } catch (err) {
       console.warn("S3 config read error:", err.message);
     }
     
      if (
        MAIL_HOST ||
        MAIL_PORT ||
        MAIL_USERNAME ||
        MAIL_PASSWORD ||
        MAIL_SMTPSECURE ||
        accessKeyId ||
        secretAccessKey
      ) {
        const newSmtp = new AuthKeys({
          MAIL_HOST,
          MAIL_PORT,
          MAIL_USERNAME,
          MAIL_PASSWORD,
          MAIL_SMTPSECURE,
          accessKeyId,
          secretAccessKey,
          bucketName,
        });

        await newSmtp.save();
      }
    }

    console.log("mongoose connection create successfully!");
  })
  .catch((error) => {
    console.log("mongoose connection create unsuccessfully!", error.message);
  });

module.exports = mongoose;
