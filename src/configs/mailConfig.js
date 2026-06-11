require("dotenv").config();
const nodemailer = require("nodemailer");
const fs = require("fs");
// Create a Nodemailer transporter

if (process.env.SERVER !== "production") {
  console.log("env mail config");
  var MAIL_HOST = process.env.MAIL_HOST;
  var MAIL_PORT = process.env.MAIL_PORT;
  var MAIL_USERNAME = process.env.MAIL_USERNAME;
  var MAIL_PASSWORD = process.env.MAIL_PASSWORD;
  var MAIL_SMTPSECURE = process.env.MAIL_SMTPSECURE;
} else {
  const smtpJson = fs.readFileSync("/var/my-bw-auth/ses_smtp_config.json", "utf8");
  const smtpConfig = JSON.parse(smtpJson);
  console.log("file mail config");
  var MAIL_HOST = smtpConfig.host;
  var MAIL_PORT = smtpConfig.port;
  var MAIL_USERNAME = smtpConfig.username;
  var MAIL_PASSWORD = smtpConfig.password;
  var MAIL_SMTPSECURE = smtpConfig.smtp_crypto;
}

const transporter = nodemailer.createTransport({
  host: MAIL_HOST,
  port: MAIL_PORT,
  secure: MAIL_SMTPSECURE === "ssl", //if port is 465 then true
  auth: {
    user: MAIL_USERNAME,
    pass: MAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates (optional) if port is 465 then true
  },
});
transporter.verify((error, success) => {
  if (error) {
    console.log('Error occurred while connecting to mail server: ', error.message);
  } else {
    console.log("Mail server connection successful!", success);
  }
});

module.exports = transporter;
