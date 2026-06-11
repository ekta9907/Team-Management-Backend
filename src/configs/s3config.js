// require("dotenv").config;
// const { S3 } = require("@aws-sdk/client-s3");
// const fs = require("fs");

// var bucketName = "bw-project-management";
// console.log("process.env.SERVER", process.env.SERVER);
// if (process.env.SERVER !== "production") {
//   console.log("env s3 config");
//   var accessKeyId = process.env.accessKeyId;
//   var secretAccessKey = process.env.secretAccessKey;
//   var bucketName = process.env.bucketName;
// } else {
//   const smtpJson = fs.readFileSync("/var/my-bw-auth/key.json", "utf8");
//   const smtpConfig = JSON.parse(smtpJson);
//   console.log("file s3 config");
//   var accessKeyId = smtpConfig.website_s3_access_id;
//   var secretAccessKey = smtpConfig.website_s3_secret_key;
//   var bucketName = "bw-project-management";
// }

// const s3 = new S3({
//   region: process.env.region,
//   credentials: {
//     accessKeyId: accessKeyId,
//     secretAccessKey: secretAccessKey,
//   },
// })
//   .then(() => {
//     console.log("success s3 connected");
//   })
//   .catch(() => {
//     console.log("unsuccess s3 connected");
//   });

// module.exports = { s3, bucketName };
