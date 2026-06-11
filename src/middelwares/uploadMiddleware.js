const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Determine destination folder based on MIME type
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    let mimeMainType = file.mimetype.split("/")[0]; // image, video, application etc.
    let folderName = "images"; // default fallback

    if (mimeMainType === "image") {
      folderName = "images";
    } else if (mimeMainType === "video") {
      folderName = "videos";
    } else {
      folderName = "pdfFiles"; // for documents or others
    }

    const folderPath = path.join("public", folderName);

    // Ensure folder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Store folder name for future access if needed
    req["folderName"] = folderName;

    callback(null, folderPath);
  },

  filename: function (req, file, callback) {
   
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1000) +
      path.extname(file.originalname);
     
    callback(null, uniqueName);
  },
});

// File type filter
const fileFilter = function (req, file, callback) {
  const allowedTypes = [
    // Image types
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
    "image/svg+xml",

    // Video types
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/x-msvideo",
    "video/quicktime",

    // Document types
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    console.warn("❌ Invalid file type:", file.mimetype);
    callback(new Error("Invalid file type"), false);
  }
};

// Configure multer
const uploadMiddleware = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: fileFilter,
});

module.exports = uploadMiddleware;

// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// const storage = multer.diskStorage({
//   destination: function (req, file, callback) {
//     let type = file.mimetype.split("/");
//     let folderName = "images";
//     if (type[0] === "image") {
//       folderName = "images";
//     } else if (type[0] === "video") {
//       folderName = "videos" || "images";
//     } else {
//       folderName = "pdfFiles" || "images";
//     }
//     req["folderName"] = folderName;
//     callback(null, path.join("public", folderName) + "/");
//   },
//   filename: function (req, file, callback) {
//     const nameFile = Date.now() + "-" + Math.round(Math.random() * 1000) + path.extname(file.originalname);
//     console.log("success pass from upload middleware");
//     callback(null, nameFile);
//   },
// });

// const fileFilter = function (req, file, callback) {
//   const allowedTypes = [
//     // Image types
//     "image/jpeg",
//     "image/png",
//     "image/gif",
//     "image/webp",
//     "image/bmp",
//     "image/tiff",
//     // Video types
//     "video/mp4",
//     "video/webm",
//     "video/ogg",
//     "video/x-msvideo",
//     "video/quicktime",
//     // Document types
//     "application/pdf",
//     "application/msword", // DOC
//     "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
//     "application/vnd.ms-excel", // XLS
//     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // XLSX
//     "application/vnd.ms-powerpoint", // PPT
//     "application/vnd.openxmlformats-officedocument.presentationml.presentation", // PPTX
//     "text/plain", // Text files
//     "image/svg+xml", // Text files
//   ];
//   if (allowedTypes.includes(file.mimetype)) {
//     callback(null, true);
//   } else {
//     callback(new Error("Invalid file type"), false);
//   }
// };
// const uploadMiddleware = multer({
//   storage: storage,
//   limit: { fileSize: 100 * 1024 * 1024 },
//   fileFilter: fileFilter,
// });

// module.exports = uploadMiddleware;

// retrive req.file.filename,  req.files[0].filename,   req.files.exampleuserImage[0].filename
// pass from route uploadMiddleware.single('image'),
// uploadMiddleware.array(name:'image',maxCount:3),
// uploadMiddleware.field({'name':exampleuserImage,maxCount:1,'name':exampleuserIDcard,maxCount:1})
