require("dotenv").config;
const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3 } = require("@aws-sdk/client-s3"); // Import the S3 client from SDK v3
const path = require("path");
const fs = require("fs");

var bucketName = "bw-project-management";
if (process.env.SERVER !== "production") {
  console.log("env s3 config");
  var accessKeyId = process.env.accessKeyId;
  var secretAccessKey = process.env.secretAccessKey;
  var bucketName = process.env.bucketName;
} else {
  const s3Json = fs.readFileSync("/var/my-bw-auth/key.json", "utf8");
  const s3Config = JSON.parse(s3Json);
  console.log("file s3 config");
  var accessKeyId = s3Config.website_s3_access_id;
  var secretAccessKey = s3Config.website_s3_secret_key;
  var bucketName = "bw-project-management";
}

//key get from /var/my-bw-auth/key.json

const s3 = new S3({
  region: process.env.region,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

const storage = multerS3({
  s3: s3,
  bucket: bucketName,
  //acl: "public-read",
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: function (req, file, callback) {
    let type = file.mimetype.split("/");
    let folderName;
    if (type[0] === "image") {
      folderName = "images";
    } else if (type[0] === "video") {
      folderName = "videos" || "images";
    } else {
      folderName = "pdfFiles" || "images";
    }
  
    const CURRENT_SITE_WORKSPACE_NUMBER = req?.CURRENT_SITE_WORKSPACE_NUMBER || null;
     // fallback if undefined
  
    let nameFile = folderName + "/" + Date.now() + "-" + Math.round(Math.random() * 1000) + path.extname(file.originalname);
    if (CURRENT_SITE_WORKSPACE_NUMBER) {
      const today = new Date();
      const dateFolder = today.toISOString().slice(0, 10).replace(/-/g, ""); // e.g., 20250808
      nameFile = `${CURRENT_SITE_WORKSPACE_NUMBER}/${dateFolder}/${folderName}/${Date.now()}-${Math.round(Math.random() * 1000)}${path.extname(file.originalname)}`;
    }
   
    callback(null, nameFile);
  },
});
const uploadOnS3Middleware = multer({ storage: storage });

module.exports = uploadOnS3Middleware;
